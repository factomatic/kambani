/// <reference types="chrome" />

import { Component, OnInit, NgZone } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { DidKeyEntryModel } from 'src/app/core/interfaces/did-key-entry';
import { minifyPublicKey } from 'src/app/core/utils/helpers';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from 'src/app/components/dialogs/password/password.dialog.component';
import { SignatureDataModel } from 'src/app/core/models/signature-data.model';
import { SigningService } from 'src/app/core/services/signing/signing.service';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-signer',
  templateUrl: './signer.component.html',
  styleUrls: ['./signer.component.scss']
})
export class SignerComponent implements OnInit {
  public pendingRequestsCount: number;
  public content: string;
  public contentPretified: string;
  public from: string;
  public selectedDIDId: string;
  public didIds: string[] = [];
  public minifyPublicKey = minifyPublicKey;
  private didKeys = {};
  private dialogMessage = 'Enter your vault password to sign the data';

  constructor(
    private dialogsService: DialogsService,
    private signingService: SigningService,
    private vaultService: VaultService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService,
    private zone: NgZone) { }

  ngOnInit() {
    this.getPendingRequestsCount();
    this.getContentToSign();
    this.getDIDIds();
  }

  onSelectChange(selectedDIDId) {
    this.selectedDIDId= selectedDIDId;
  }

  signData() {
    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, this.dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();

          const signingKey: DidKeyEntryModel = this.didKeys[this.selectedDIDId][0];

          this.signingService
            .signData(this.content, signingKey, vaultPassword)
            .subscribe((signatureData: SignatureDataModel) => {
              if (signatureData) {
                chrome.runtime.sendMessage({type: ChromeMessageType.SendSignedDataBack, data: signatureData});
                this.spinner.hide();
                this.toastr.success('Data successfully signed!', null, {timeOut: 1000});
                this.clearContentData();
                this.getPendingRequestsCount();
                this.getContentToSign();
              } else {
                this.spinner.hide();
                this.toastr.error('Incorrect vault password');
              }
            });
        }
      });
  }

  cancelSigning() {
    this.cancelContentToSign();
    this.getPendingRequestsCount();
    this.getContentToSign();
  }

  skipSigning() {
    this.skipContentToSign();
    this.getPendingRequestsCount();
    this.getContentToSign();
  }

  private getDIDIds() {
    const didDocuments = this.vaultService.getAllDIDDocuments();
    for (const didId in didDocuments) {
      const didIdDocument = didDocuments[didId];
      if (didIdDocument.didKey && didIdDocument.didKey.length > 0) {
        this.didIds.push(didId);
        this.didKeys[didId] = didIdDocument.didKey;
      }
    }
    
    if (this.didIds) {
      this.selectedDIDId = this.didIds[0];
    }
  }

  private getContentToSign() {
    chrome.runtime.sendMessage({type: ChromeMessageType.GetContentToSign}, (response) => {
      this.zone.run(() => {
        if (response.success) {
          this.from = response.contentToSign.from;
          this.content = response.contentToSign.content;

          try {
            const parsedContent = JSON.parse(this.content);
            this.contentPretified = JSON.stringify(parsedContent, null, 2);
          } catch {
            this.contentPretified = this.content;
          }
        }
      });
    });
  }

  private getPendingRequestsCount() {
    chrome.runtime.sendMessage({type: ChromeMessageType.PendingRequestsCount}, (response) => {
      this.zone.run(() => {
        this.pendingRequestsCount = response.pendingRequestsCount;
        this.signingService.updatePendingRequestsCount(this.pendingRequestsCount);
      });
    });
  }

  private cancelContentToSign() {
    this.toastr.info('Signing request cancelled!', null, {timeOut: 1000});
    chrome.runtime.sendMessage({type: ChromeMessageType.CancelSigning, data: {content: this.content}});
    this.clearContentData();
  }

  private skipContentToSign() {
    this.toastr.info('Signing request skipped!', null, {timeOut: 1000});
    chrome.runtime.sendMessage({type: ChromeMessageType.SkipSigning});
    this.clearContentData();
  }

  private clearContentData() {
    this.content = undefined;
    this.contentPretified = undefined;
    this.from = undefined;
  }
}
