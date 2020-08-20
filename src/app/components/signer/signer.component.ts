import { Component, OnInit, NgZone } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { Transaction } from 'factom';
import { sha512 } from 'factom/src/util.js';

import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { DidKeyEntryModel } from 'src/app/core/interfaces/did-key-entry';
import { ManagementKeyEntryModel } from 'src/app/core/interfaces/management-key-entry';
import { minifyAddress } from 'src/app/core/utils/helpers';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from 'src/app/components/dialogs/password/password.dialog.component';
import { RequestKeyType } from 'src/app/core/enums/request-key-type';
import { RequestType } from 'src/app/core/enums/request-type';
import { ResultModel } from 'src/app/core/models/result.model';
import { SignatureDataModel } from 'src/app/core/models/signature-data.model';
import { SigningService } from 'src/app/core/services/signing/signing.service';
import { TransactionType } from 'src/app/core/enums/transaction-type';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-signer',
  templateUrl: './signer.component.html',
  styleUrls: ['./signer.component.scss']
})
export class SignerComponent implements OnInit {
  public RequestKeyType = RequestKeyType;
  public RequestType = RequestType;
  public TransactionType = TransactionType;
  public pendingRequestsCount: number;
  public request: any;
  public from: string;
  public dataToSign: string;
  public requestKeyType: string;
  public requestType: string;
  public txType: string;
  public inputAmount: number;
  public inputAsset: string;
  public outputAsset: string;
  public outputAddress: string;
  public txMetadata: any;
  public allDIDsPublicInfo = {};
  public fctAddressesPublicInfo = {};
  public ecAddressesPublicInfo = {};
  public blockSigningKeysPublicInfo = {};
  public allDIDIds: string[] = [];
  public didIdsWithDIDKeys: string[] = [];
  public availableDIDIds: string[] = [];
  public fctAddresses: string[] = [];
  public ecAddresses: string[] = [];
  public blockSigningKeys: string[] = [];
  public availableFactomAddresses: string[] = [];
  public availableFactomAddressesPublicInfo = {};
  public availableDIDKeys: any[];
  public selectedDIDId: string;
  public didIdSpecified: boolean;
  public selectedDIDKeyId: string;
  public didKeySpecified: boolean;
  public selectedFactomAddress: string;
  public factomAddressSpecified: boolean;
  public selectedKey: string;
  public keySpecified: boolean;
  public minifyAddress = minifyAddress;

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
    this.availableDIDKeys = this.getDIDKeys(this.selectedDIDId);
    this.selectedDIDKeyId = this.availableDIDKeys[0].id;
  }

  onSelectDIDKeyChange(selectedDIDKeyId: string) {
    this.selectedDIDKeyId = selectedDIDKeyId;
  }

  onSelectAddressChange(selectedFactomAddress: string) {
    this.selectedFactomAddress = selectedFactomAddress;
  }

  onSelectKeyChange(selectedKey: string) {
    this.selectedKey = selectedKey;
  }

  signData() {
    let dialogMessage = 'Enter your vault password to sign the ';
    dialogMessage += this.requestType == RequestType.Data
      ? 'data'
      : 'transaction';

    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();

          if (this.requestType == RequestType.Data) {
            const data = this.request.requestInfo.data;

            const dataToSign = typeof data == "string"
              ? data
              : JSON.stringify(data);

            let signingKeyOrAddress;
            if ([RequestKeyType.ManagementKey, RequestKeyType.DIDKey].includes(this.requestKeyType as RequestKeyType)) {
              signingKeyOrAddress = this.availableDIDKeys.find(dk => dk.id == this.selectedDIDKeyId);
            } else if ([RequestKeyType.FCT, RequestKeyType.EC].includes(this.requestKeyType as RequestKeyType)) {
              signingKeyOrAddress = this.selectedFactomAddress;
            } else {
              signingKeyOrAddress = this.selectedKey;
            }

            this.signDataRequest(dataToSign, signingKeyOrAddress, vaultPassword);
          } else {
            this.signPegNetRequest(this.selectedFactomAddress, vaultPassword);
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

  toHumanReadable(amount: number) {
    return amount / Math.pow(10, 8);
  }

  private signDataRequest(dataToSign: string, signingKeyOrAddress: any, vaultPassword: string) {
    this.signingService
      .signData(dataToSign, this.requestKeyType, signingKeyOrAddress, vaultPassword)
      .subscribe((signatureData: SignatureDataModel) => {
        if (signatureData) {
          chrome.runtime.sendMessage({type: ChromeMessageType.SendSigningRequestResponse, data: {
            requestId: this.request.requestId,
            ...signatureData
          }});

          this.displaySuccessMessageAndUpdateState('Data successfully signed!');
        } else {
          this.spinner.hide();
          this.toastr.error('Incorrect vault password');
        }
      });
  }

  private signPegNetRequest(fctPublicAddress: string, vaultPassword: string) {
    if (this.txType == TransactionType.Burn) {
      this.vaultService
        .getPrivateKeyOrAddress(fctPublicAddress, vaultPassword)
        .subscribe((result: ResultModel) => {
          if (result.success) {
            const fctPrivateAddress = result.message;
            const tx = Transaction
              .builder()
              .input(fctPrivateAddress, this.inputAmount)
              .output('EC2BURNFCT2PEGNETooo1oooo1oooo1oooo1oooo1oooo19wthin', 0)
              .build();
            
            chrome.runtime.sendMessage({type: ChromeMessageType.SendSigningRequestResponse, data: {
              requestId: this.request.requestId,
              transaction: tx.marshalBinary().toString('hex')
            }});
  
            this.displaySuccessMessageAndUpdateState('Transaction successfully signed!');
          } else {
            this.spinner.hide();
            this.toastr.error(result.message);
          }
        });

    } else {
      const unixSeconds = Math.round(new Date().getTime() / 1000).toString();
      const entryContent = this.txType == TransactionType.Transfer
        ? this.buildTransferEntry()
        : this.buildConversionEntry();

      const dataToSign = sha512(Buffer.concat([
        Buffer.from('0'),
        Buffer.from(unixSeconds),
        Buffer.from('cffce0f409ebba4ed236d49d89c70e4bd1f1367d86402a3363366683265a242d', 'hex'),
        Buffer.from(entryContent)
      ]));

      this.signingService
        .signPegNetTransaction(dataToSign, fctPublicAddress, vaultPassword)
        .subscribe((signatureData: SignatureDataModel) => {
          if (signatureData) {
            const rcd = Buffer.concat([Buffer.from([1]), signatureData.publicKey]).toString('hex');
            const signature = signatureData.signature.toString('hex');
            const extIds = [unixSeconds, rcd, signature];

            chrome.runtime.sendMessage({type: ChromeMessageType.SendSigningRequestResponse, data: {
              requestId: this.request.requestId,
              entry: [extIds, entryContent]
            }});

            this.displaySuccessMessageAndUpdateState('Transaction successfully signed!');
          } else {
            this.spinner.hide();
            this.toastr.error('Incorrect vault password');
          }
        });
    }
  }

  private buildConversionEntry() {
    return JSON.stringify({
      version: 1,
      transactions: [{
          input: {
            address: this.selectedFactomAddress,
            amount: this.inputAmount,
            type: this.inputAsset
          },
          conversion: this.outputAsset,
          metadata: this.txMetadata
        }
      ],
    });
  }

  private buildTransferEntry() {
    return JSON.stringify({
      version: 1,
      transactions: [{
          input: {
            address: this.selectedFactomAddress,
            amount: this.inputAmount,
            type: this.inputAsset
          },
          transfers: [{
            address: this.outputAddress,    
            amount: this.inputAmount
          }],
          metadata: this.txMetadata
        }
      ],
    });
  }

  private displaySuccessMessageAndUpdateState(message: string) {
    this.spinner.hide();
    this.toastr.success(message, null, {timeOut: 1000});
    this.clearRequestData();
    this.getPendingRequestsCount();
    this.getSigningRequest();
  }

  private getAllAvailableSigningKeys() {
    this.getDIDIds();
    this.fctAddressesPublicInfo = this.vaultService.getFCTAddressesPublicInfo();
    this.fctAddresses = Object.keys(this.fctAddressesPublicInfo);
    this.ecAddressesPublicInfo = this.vaultService.getECAddressesPublicInfo();
    this.ecAddresses = Object.keys(this.ecAddressesPublicInfo);
    this.blockSigningKeysPublicInfo = this.vaultService.getBlockSigningKeysPublicInfo();
    this.blockSigningKeys = Object.keys(this.blockSigningKeysPublicInfo);
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

  private getDIDKeys(didId: string): DidKeyEntryModel[] | ManagementKeyEntryModel[] {
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
          this.txType = this.request.requestInfo.txType;

          this.requestKeyType = this.requestType == RequestType.Data
            ? this.request.requestInfo.keyType
            : RequestKeyType.FCT;

          if ((this.requestKeyType == RequestKeyType.DIDKey && this.didIdsWithDIDKeys.length > 0)
            || (this.requestKeyType == RequestKeyType.ManagementKey && this.allDIDIds.length > 0)) {
              this.availableDIDIds = this.requestKeyType == RequestKeyType.DIDKey
                ? this.didIdsWithDIDKeys
                : this.allDIDIds;
              this.selectedDIDId = this.availableDIDIds[0];
              this.availableDIDKeys = this.getDIDKeys(this.selectedDIDId);
              this.selectedDIDKeyId = this.availableDIDKeys[0].id;

              const did = this.request.requestInfo.did;
              if (did) {
                if (this.availableDIDIds.includes(did)) {
                  this.selectedDIDId = did;
                  this.availableDIDKeys = this.getDIDKeys(this.selectedDIDId);
                  this.selectedDIDKeyId = this.availableDIDKeys[0].id;
                  this.didIdSpecified = true;
  
                  const selectedKeyAlias = this.request.requestInfo.keyIdentifier;
                  if (selectedKeyAlias) {
                    const selectedKey = this.availableDIDKeys.find(k => k.id.split('#')[1] == selectedKeyAlias);
                    if (selectedKey) {
                      this.selectedDIDKeyId = selectedKey.id;
                      this.didKeySpecified = true;
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

            const selectedAddress = this.requestType == RequestType.Data
              ? this.request.requestInfo.keyIdentifier
              : this.request.requestInfo.inputAddress;

            if (selectedAddress) {
              if (this.availableFactomAddresses.includes(selectedAddress)) {
                this.selectedFactomAddress = selectedAddress;
                this.factomAddressSpecified = true;
              } else {
                this.cancelSigning(`The ${this.requestKeyType.toUpperCase()} Address requested for signing does not exist!`);
                return;
              }
            }
          } else if (this.requestKeyType == RequestKeyType.BlockSigningKey && this.blockSigningKeys.length > 0) {
            this.selectedKey = this.blockSigningKeys[0];
            const selectedKey = this.request.requestInfo.keyIdentifier;

            if (selectedKey) {
              if (this.blockSigningKeys.includes(selectedKey)) {
                this.selectedKey = selectedKey;
                this.keySpecified = true;
              } else {
                this.cancelSigning('The Block Signing key requested for signing does not exist!');
                return;
              }
            }
          }

          if (this.requestType == RequestType.Data) {
            this.dataToSign = JSON.stringify(this.request.requestInfo.data, null, 2);       
          } else {
            this.inputAmount = this.request.requestInfo.inputAmount;
            this.inputAsset = this.request.requestInfo.inputAsset;
            this.outputAsset = this.request.requestInfo.outputAsset;
            this.outputAddress = this.request.requestInfo.outputAddress;
            this.txMetadata = this.request.requestInfo.txMetadata;
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
    this.requestType = undefined;
    this.requestKeyType = undefined;
    this.txType = undefined;
    this.inputAmount = undefined;
    this.inputAsset = undefined;
    this.outputAsset = undefined;
    this.outputAddress = undefined;
    this.txMetadata = undefined;
    this.selectedDIDId = undefined;
    this.selectedDIDKeyId = undefined;
    this.availableDIDIds = undefined;
    this.availableDIDKeys = undefined;
    this.selectedFactomAddress = undefined;
    this.selectedKey = undefined;
    this.availableFactomAddresses = undefined;
    this.availableFactomAddressesPublicInfo = undefined;
    this.factomAddressSpecified = false;
    this.didKeySpecified = false;
    this.didIdSpecified = false;
    this.keySpecified = false;
  }
}
