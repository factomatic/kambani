/// <reference types="chrome" />

import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { minifyPublicKey } from '../../core/utils/helpers';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from '../dialogs/password/password.dialog.component';
import { VaultService } from '../../core/services/vault/vault.service';

@Component({
  selector: 'app-signer',
  templateUrl: './signer.component.html',
  styleUrls: ['./signer.component.scss']
})
export class SignerComponent implements OnInit {
  protected content: object;
  protected contentPretified: string;
  protected from: string;
  protected selectedPublicKey: string;
  protected publicKeys = [];
  protected minifyPublicKey = minifyPublicKey;
  private dialogMessage = 'Enter your vault password to sign the data';

  constructor(
    private dialogsService: DialogsService,
    private route: ActivatedRoute,
    private router: Router,
    private vaultService: VaultService,
    private toastr: ToastrService,
    private spinner: NgxSpinnerService) { }

  ngOnInit() {
    const data =  JSON.parse(this.route.snapshot.queryParamMap.get('contentToSign'));
    this.from = data.from;
    this.content = data.content;
    this.contentPretified = JSON.stringify(this.content, null, 2);

    const publicKeys = this.vaultService.getVaultPublicKeys();
    if (publicKeys) {
      this.publicKeys = JSON.parse(publicKeys);
    }

    this.selectedPublicKey = this.publicKeys[0];
  }

  onSelectChange(selectedPublicKey) {
    this.selectedPublicKey = selectedPublicKey;
  }

  signData() {
    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.Small, this.dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();

          this.vaultService
            .signData(JSON.stringify(this.content), this.selectedPublicKey, vaultPassword)
            .subscribe(signature => {
              if (signature) {
                chrome.runtime.sendMessage({type: 'sendSignedDataBack', data: {
                  signature: signature,
                  publicKey: this.selectedPublicKey
                }});
                this.spinner.hide();
                this.toastr.success('Signed data successfully');
                this.router.navigate(['home']);
              } else {
                this.spinner.hide();
                this.toastr.error('Incorrect vault password');
              }
            });
        }
      });
  }

  cancelSigning() {
    chrome.runtime.sendMessage({type: 'cancelSigning'});
    this.router.navigate(['home']);
  }
}
