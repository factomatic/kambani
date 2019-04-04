/// <reference types="chrome" />

import { Component, OnInit, NgZone } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { KeyViewModel } from 'src/app/core/models/KeyViewModel';
import { minifyPublicKey } from 'src/app/core/utils/helpers';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from 'src/app/components/dialogs/password/password.dialog.component';
import { SignatureDataModel } from 'src/app/core/models/SignatureDataModel';
import { SigningService } from 'src/app/core/services/signing/signing.service';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-signer',
  templateUrl: './signer.component.html',
  styleUrls: ['./signer.component.scss']
})
export class SignerComponent implements OnInit {
  public pendingRequestsCount: number;
  public newRequestsReceived: boolean;
  public content: string;
  public contentPretified: string;
  public from: string;
  public selectedPublicKey: string;
  public publicKeys: KeyViewModel[] = [];
  public minifyPublicKey = minifyPublicKey;
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
    this.checkNewRequestsReceived();
    this.getPublicKeys();
  }

  onSelectChange(selectedPublicKey) {
    this.selectedPublicKey = selectedPublicKey;
  }

  signData() {
    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.Small, this.dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();

          this.signingService
            .signData(this.content, this.selectedPublicKey, vaultPassword)
            .subscribe((signatureData: SignatureDataModel) => {
              if (signatureData) {
                chrome.runtime.sendMessage({type: ChromeMessageType.SendSignedDataBack, data: signatureData});
                this.spinner.hide();
                this.toastr.success('Signed data successfully!');
                this.clearContentData();
                this.updatePendingRequestsCount();
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
    this.getContentToSign();
  }

  skipSigning() {
    this.skipContentToSign();
    this.getContentToSign();
  }

  private getPublicKeys() {
    const publicKeys = this.vaultService.getVaultPublicKeys();
    if (publicKeys) {
      const publicKeysArray = JSON.parse(publicKeys);
      const publicKeysAliases = JSON.parse(this.vaultService.getVaultPublicKeysAliases());
      publicKeysArray.forEach(publicKey => {
        this.publicKeys.push(new KeyViewModel(
          publicKeysAliases[publicKey] ? publicKeysAliases[publicKey] : 'unknown',
          publicKey
        ));
      });

      this.selectedPublicKey = this.publicKeys[0].publicKey;
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
    chrome.browserAction.getBadgeText({}, (result) => {
      this.pendingRequestsCount = parseInt(result, 10);
    });
  }

  private checkNewRequestsReceived() {
    chrome.runtime.sendMessage({type: ChromeMessageType.NewRequestsReceived}, (response) => {
      this.zone.run(() => {
        this.newRequestsReceived = response.success ? true : false;
      });
    });
  }

  private cancelContentToSign() {
    this.toastr.info('Signing request cancelled!');
    chrome.runtime.sendMessage({type: ChromeMessageType.CancelSigning});
    this.clearContentData();
    this.updatePendingRequestsCount();
  }

  private skipContentToSign() {
    this.toastr.info('Signing request skipped!');
    chrome.runtime.sendMessage({type: ChromeMessageType.SkipSigning});
    this.clearContentData();
  }

  private clearContentData() {
    this.content = undefined;
    this.contentPretified = undefined;
    this.from = undefined;
    this.newRequestsReceived = false;
  }

  private updatePendingRequestsCount() {
    this.pendingRequestsCount--;
    this.signingService.updatePendingRequestsCount(this.pendingRequestsCount);
  }
}
