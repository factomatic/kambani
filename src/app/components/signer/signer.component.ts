import { Component, OnInit, NgZone } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { DidKeyEntryModel } from 'src/app/core/interfaces/did-key-entry';
import { ManagementKeyEntryModel } from 'src/app/core/interfaces/management-key-entry';
import { minifyAddress } from 'src/app/core/utils/helpers';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from 'src/app/components/dialogs/password/password.dialog.component';
import { RequestKeyType } from 'src/app/core/enums/request-key-type';
import { RequestType } from 'src/app/core/enums/request-type';
import { SignatureDataModel } from 'src/app/core/models/signature-data.model';
import { SigningService } from 'src/app/core/services/signing/signing.service';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-signer',
  templateUrl: './signer.component.html',
  styleUrls: ['./signer.component.scss']
})
export class SignerComponent implements OnInit {
  public RequestKeyType = RequestKeyType;
  public RequestType = RequestType;
  public pendingRequestsCount: number;
  public request;
  public dataToSign: string;
  public requestKeyType: string;
  public requestType: string;
  public txMetadata: any;
  public from: string;
  public allDIDsPublicInfo = {};
  public fctAddressesPublicInfo = {};
  public ecAddressesPublicInfo = {};
  public allDIDIds: string[] = [];
  public didIdsWithDIDKeys: string[] = [];
  public availableDIDIds: string[] = [];
  public fctAddresses: string[] = [];
  public ecAddresses: string[] = [];
  public availableFactomAddresses: string[] = [];
  public availableFactomAddressesPublicInfo = {};
  public availableKeys: any[];
  public selectedDIDId: string;
  public didIdSpecified: boolean;
  public selectedKeyId: string;
  public keySpecified: boolean;
  public selectedFactomAddress: string;
  public factomAddressSpecified: boolean;
  public minifyAddress = minifyAddress;
  private dialogMessage = 'Enter your vault password to sign the data';

  constructor(
    private dialogsService: DialogsService,
    private signingService: SigningService,
    private vaultService: VaultService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private zone: NgZone) { }

  ngOnInit() {
    this.getAllAvailableSigningKeys();
    this.getPendingRequestsCount();
    this.getSigningRequest();
  }

  onSelectDIDChange(selectedDIDId: string) {
    this.selectedDIDId = selectedDIDId;
    this.availableKeys = this.getKeys(this.selectedDIDId);
    this.selectedKeyId = this.availableKeys[0].id;
  }

  onSelectKeyChange(selectedKeyId: string) {
    this.selectedKeyId = selectedKeyId;
  }

  onSelectAddressChange(selectedFactomAddress: string) {
    this.selectedFactomAddress = selectedFactomAddress;
  }

  signData() {
    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, this.dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();

          if (this.requestType == RequestType.Basic) {
            const dataToSign = typeof this.request.data == "string"
              ? this.request.data
              : JSON.stringify(this.request.data);

            const signingKeyOrAddress = this.selectedKeyId
              ? this.availableKeys.find(dk => dk.id == this.selectedKeyId)
              : this.selectedFactomAddress;

            this.signBasicRequest(dataToSign, signingKeyOrAddress, vaultPassword);
          } else {
            const dataToSign = Buffer.from(Object.values(this.request.data));
            this.signPegnetWalletRequest(dataToSign, this.selectedFactomAddress, vaultPassword);
          }    
        }
      });
  }

  cancelSigning(message?: string) {
    if (message) {
      this.toastr.error(message, null, {timeOut: 5000});
    } else {
      this.toastr.info('Signing request cancelled!', null, {timeOut: 1000});
    }

    this.cancelSigningRequest();
    this.getPendingRequestsCount();
    this.getSigningRequest();
  }

  skipSigning() {
    this.skipSigningRequest();
    this.getPendingRequestsCount();
    this.getSigningRequest();
  }

  private signBasicRequest(dataToSign: string, signingKeyOrAddress: any, vaultPassword: string) {
    this.signingService
      .signData(dataToSign, this.requestKeyType, signingKeyOrAddress, vaultPassword)
      .subscribe((signatureData: SignatureDataModel) => {
        if (signatureData) {
          chrome.runtime.sendMessage({type: ChromeMessageType.SendSigningRequestResponse, data: {
            requestId: this.request.requestId,
            ...signatureData
          }});

          this.spinner.hide();
          this.toastr.success('Data successfully signed!', null, {timeOut: 1000});
          this.clearRequestData();
          this.getPendingRequestsCount();
          this.getSigningRequest();
        } else {
          this.spinner.hide();
          this.toastr.error('Incorrect vault password');
        }
      });
  }

  private signPegnetWalletRequest(dataToSign: Buffer, fctPublicAddress: string, vaultPassword: string) {
    this.signingService
      .signPegnetWalletTransaction(dataToSign, fctPublicAddress, vaultPassword)
      .subscribe((signatureData: SignatureDataModel) => {
        if (signatureData) {
          chrome.runtime.sendMessage({type: ChromeMessageType.SendSigningRequestResponse, data: {
            requestId: this.request.requestId,
            ...signatureData
          }});

          this.spinner.hide();
          this.toastr.success('Data successfully signed!', null, {timeOut: 1000});
          this.clearRequestData();
          this.getPendingRequestsCount();
          this.getSigningRequest();
        } else {
          this.spinner.hide();
          this.toastr.error('Incorrect vault password');
        }
      });
  }

  private getAllAvailableSigningKeys() {
    this.getDIDIds();
    this.fctAddressesPublicInfo = this.vaultService.getFCTAddressesPublicInfo();
    this.fctAddresses = Object.keys(this.fctAddressesPublicInfo);
    this.ecAddressesPublicInfo = this.vaultService.getECAddressesPublicInfo();
    this.ecAddresses = Object.keys(this.ecAddressesPublicInfo);
  }

  private getDIDIds() {
    this.allDIDsPublicInfo = this.vaultService.getAllDIDsPublicInfo();
    this.allDIDIds = Object.keys(this.allDIDsPublicInfo);

    for (const didId in this.allDIDsPublicInfo) {
      const didDocument = this.allDIDsPublicInfo[didId].didDocument;
      if (didDocument.didKey && didDocument.didKey.length > 0) {
        this.didIdsWithDIDKeys.push(didId);
      }
    }
  }

  private getKeys(didId: string): DidKeyEntryModel[] | ManagementKeyEntryModel[] {
    if (this.requestKeyType == RequestKeyType.DIDKey) {
      return this.allDIDsPublicInfo[didId].didDocument.didKey;
    }

    return this.allDIDsPublicInfo[didId].didDocument.managementKey;
  }

  private getSigningRequest() {
    chrome.runtime.sendMessage({type: ChromeMessageType.GetSigningRequest}, (response) => {
      this.zone.run(() => {
        if (response.success) {
          this.from = response.signingRequest.from;
          this.request = response.signingRequest.content;
          this.requestType = this.request.requestType;
          this.requestKeyType = this.request.keyType;

          if ((this.requestKeyType == RequestKeyType.DIDKey && this.didIdsWithDIDKeys.length > 0)
            || (this.requestKeyType == RequestKeyType.ManagementKey && this.allDIDIds.length > 0)) {
              this.availableDIDIds = this.requestKeyType == RequestKeyType.DIDKey
                ? this.didIdsWithDIDKeys
                : this.allDIDIds;
              this.selectedDIDId = this.availableDIDIds[0];
              this.availableKeys = this.getKeys(this.selectedDIDId);
              this.selectedKeyId = this.availableKeys[0].id;

              if (this.request.did) {
                if (this.availableDIDIds.includes(this.request.did)) {
                  this.selectedDIDId = this.request.did;
                  this.availableKeys = this.getKeys(this.selectedDIDId);
                  this.selectedKeyId = this.availableKeys[0].id;
                  this.didIdSpecified = true;

                  const selectedKeyAlias = this.request.keyIdentifier;
                  if (selectedKeyAlias) {
                    const selectedKey = this.availableKeys.find(k => k.id.split('#')[1] == selectedKeyAlias);
                    if (selectedKey) {
                      this.selectedKeyId = selectedKey.id;
                      this.keySpecified = true;
                    } else {
                      const keyType = this.requestKeyType == RequestKeyType.DIDKey
                        ? 'DID Key'
                        : 'Management Key';
                      this.cancelSigning(`The ${keyType} requested for signing does not exist!`);
                      return;
                    }
                  }
                } else {
                  if (this.requestKeyType == RequestKeyType.DIDKey
                    && this.allDIDIds.includes(this.request.did)) {
                    this.cancelSigning('The Identity requested for signing does not have any Signing keys!');
                  } else {
                    this.cancelSigning('The Identity requested for signing does not exist!');
                  }

                  return;
                }
              }
          } else if ((this.requestKeyType == RequestKeyType.FCT && this.fctAddresses.length > 0)
            || (this.requestKeyType == RequestKeyType.EC && this.ecAddresses.length > 0)) {
            this.availableFactomAddresses = this.requestKeyType == RequestKeyType.FCT
            ? this.fctAddresses
            : this.ecAddresses;

            this.availableFactomAddressesPublicInfo = this.requestKeyType == RequestKeyType.FCT
            ? this.fctAddressesPublicInfo
            : this.ecAddressesPublicInfo;

            this.selectedFactomAddress = this.availableFactomAddresses[0];

            const selectedAddress = this.request.keyIdentifier;
            if (selectedAddress) {
              if (this.availableFactomAddresses.includes(selectedAddress)) {
                this.selectedFactomAddress = selectedAddress;
                this.factomAddressSpecified = true;
              } else {
                this.cancelSigning(`The ${this.requestKeyType.toUpperCase()} Address requested for signing does not exist!`);
                return;
              }
            }
          }

          if (this.requestType == RequestType.Basic) {
            this.dataToSign = JSON.stringify(this.request.data, null, 2);
          } else {
            this.txMetadata = this.request.txMetadata;
          }
        }
      });
    });
  }

  private getPendingRequestsCount() {
    chrome.runtime.sendMessage({type: ChromeMessageType.PendingSigningRequestsCount}, (response) => {
      this.zone.run(() => {
        this.pendingRequestsCount = response.pendingSigningRequestsCount;
        this.signingService.updatePendingRequestsCount(this.pendingRequestsCount);
      });
    });
  }

  private cancelSigningRequest() {
    chrome.runtime.sendMessage({type: ChromeMessageType.CancelSigningRequest, data: {requestId: this.request.requestId}});
    this.clearRequestData();
  }

  private skipSigningRequest() {
    this.toastr.info('Signing request skipped!', null, {timeOut: 1000});
    chrome.runtime.sendMessage({type: ChromeMessageType.SkipSigningRequest});
    this.clearRequestData();
  }

  private clearRequestData() {
    this.request = undefined;
    this.dataToSign = undefined;
    this.from = undefined;
    this.requestKeyType = undefined;
    this.selectedDIDId = undefined;
    this.selectedKeyId = undefined;
    this.availableDIDIds = undefined;
    this.availableKeys = undefined;
    this.selectedFactomAddress = undefined;
    this.availableFactomAddresses = undefined;
    this.availableFactomAddressesPublicInfo = undefined;
    this.factomAddressSpecified = false;
    this.keySpecified = false;
    this.didIdSpecified = false;
  }
}
