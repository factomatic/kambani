import { Component, OnInit, NgZone } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Transaction } from 'factom';
import {sha512} from 'factom/src/util.js'

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
  public txType: string;
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

          if (this.requestType == RequestType.Basic || this.requestType == "data") {
            let data;
            if (this.requestType == "data") {
              data = this.request.requestInfo.data;
            } else {
              data = this.request.data;
            }

            const dataToSign = typeof data == "string"
              ? data
              : JSON.stringify(data);

            const signingKeyOrAddress = this.selectedKeyId
              ? this.availableKeys.find(dk => dk.id == this.selectedKeyId)
              : this.selectedFactomAddress;

            this.signBasicRequest(dataToSign, signingKeyOrAddress, vaultPassword);
          } else {
            const dataToSign = this.buildTransactionDataToSign();

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

  private buildTransactionDataToSign() {
    if (this.requestType == RequestType.PegnetTransaction || (this.requestType == "pegnet" && this.txType !== "burn")) {
      const unixSeconds = Math.round(new Date().getTime() / 1000);
      const entryContent = this.txType == 'transfer'
        ? this.buildTransferEntry()
        : this.buildConversionEntry();

      return sha512(Buffer.concat([
        Buffer.from('0'),
        Buffer.from(unixSeconds.toString()),
        Buffer.from('cffce0f409ebba4ed236d49d89c70e4bd1f1367d86402a3363366683265a242d', 'hex'),
        Buffer.from(entryContent)
      ]));

    } else {
      const amount = this.txMetadata.amount !== undefined
        ? this.txMetadata.amount
        : this.txMetadata.inputAmount;

      const tx = Transaction
        .builder()
        .input(this.selectedFactomAddress, amount * Math.pow(10, 8))
        .output('EC2BURNFCT2PEGNETooo1oooo1oooo1oooo1oooo1oooo19wthin', 0)
        .build();

      return tx['marshalBinarySig'];
    }
  }

  private buildConversionEntry() {
    return JSON.stringify({
      version: 1,
      transactions: [{
          input: {
            address: this.selectedFactomAddress,
            amount: this.txMetadata.inputAmount * Math.pow(10, 8),
            type: this.txMetadata.inputAsset
          },
          conversion: this.txMetadata.outputAsset,
          metadata: {
            wallet: 'https://pegnet.exchange'
          }
        }
      ],
    });
  }

  private buildTransferEntry() {
    const inputAmount = this.txMetadata.inputAmount * Math.pow(10, 8);

    return JSON.stringify({
      version: 1,
      transactions: [{
          input: {
            address: this.selectedFactomAddress,
            amount: inputAmount,
            type: this.txMetadata.inputAsset
          },
          transfers: [{
            address: this.txMetadata.outputAddress,    
            amount: inputAmount
          }],
          metadata: {
            wallet: "https://pegnet.exchange"
          }
        }
      ],
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

          if (this.request.requestInfo) {
            if (this.requestType == "data") {
              this.requestKeyType = this.request.requestInfo.keyType;
            } else {
              this.requestKeyType = RequestKeyType.FCT;
              this.txType = this.request.requestInfo.txType;
            }
          } else {
            this.requestKeyType = this.request.keyType;

            if (this.request.txType) {
              this.txType = this.request.txType;
            }
          }

          if ((this.requestKeyType == RequestKeyType.DIDKey && this.didIdsWithDIDKeys.length > 0)
            || (this.requestKeyType == RequestKeyType.ManagementKey && this.allDIDIds.length > 0)) {
              this.availableDIDIds = this.requestKeyType == RequestKeyType.DIDKey
                ? this.didIdsWithDIDKeys
                : this.allDIDIds;
              this.selectedDIDId = this.availableDIDIds[0];
              this.availableKeys = this.getKeys(this.selectedDIDId);
              this.selectedKeyId = this.availableKeys[0].id;

              if (this.request.did || (this.request.requestInfo && this.request.requestInfo.did)) {
                const did = this.request.did !== undefined
                  ? this.request.did
                  : this.request.requestInfo.did;
                
                if (this.availableDIDIds.includes(did)) {
                  this.selectedDIDId = did;
                  this.availableKeys = this.getKeys(this.selectedDIDId);
                  this.selectedKeyId = this.availableKeys[0].id;
                  this.didIdSpecified = true;

                  let selectedKeyAlias;
                  if (this.request.requestInfo) {
                    selectedKeyAlias = this.request.requestInfo.keyIdentifier;
                  } else {
                    selectedKeyAlias = this.request.keyIdentifier;
                  }
                  
                  if (selectedKeyAlias) {
                    const selectedKey = this.availableKeys.find(k => k.id.split('#')[1] == selectedKeyAlias);
                    if (selectedKey) {
                      this.selectedKeyId = selectedKey.id;
                      this.keySpecified = true;
                    } else {
                      const keyType = this.requestKeyType == RequestKeyType.DIDKey
                        ? 'Signing Key'
                        : 'Management Key';
                      this.cancelSigning(`The ${keyType} requested for signing does not exist!`);
                      return;
                    }
                  }
                } else {
                  if (this.requestKeyType == RequestKeyType.DIDKey
                    && this.allDIDIds.includes(did)) {
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

            let selectedAddress;
            if (this.request.requestInfo) {
              if (this.requestType == "data") {
                selectedAddress = this.request.requestInfo.keyIdentifier;
              } else {
                selectedAddress = this.request.requestInfo.inputAddress;
              }
            } else {
              selectedAddress = this.request.keyIdentifier;
            }

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

          if (this.requestType == RequestType.Basic || this.requestType == "data") {
            if (this.request.data) {
              this.dataToSign = JSON.stringify(this.request.data, null, 2);
            } else {
              this.dataToSign = JSON.stringify(this.request.requestInfo.data, null, 2);
            }           
          } else {
            if (this.request.requestInfo) {
              this.txMetadata = {
                inputAmount: this.request.requestInfo.inputAmount,
                inputAsset: this.request.requestInfo.inputAsset,
                outputAsset: this.request.requestInfo.outputAsset,
                outputAddress: this.request.requestInfo.outputAddress
              };
            } else {
              this.txMetadata = this.request.txMetadata;
            }
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
