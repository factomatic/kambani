declare const Buffer;
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { KeyType } from 'src/app/core/enums/key-type';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from '../../dialogs/password/password.dialog.component';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { SignatureType } from 'src/app/core/enums/signature-type';

@Component({
  selector: 'app-import-key',
  templateUrl: './import-key.component.html',
  styleUrls: ['./import-key.component.scss']
})
export class ImportKeyComponent implements OnInit {
  public privateKeyForm: FormGroup;
  private selectedType: string;

  constructor(
    private dialogsService: DialogsService,
    private fb: FormBuilder,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private keysService: KeysService,
    private vaultService: VaultService ) { }

  ngOnInit() {
    this.selectedType = KeyType.BlockSigningKey;
    this.createPrivateKeyForm();
  }

  createPrivateKeyForm() {
    this.privateKeyForm = this.fb.group({
      type: [this.selectedType, Validators.required],
      nickname: ['', Validators.required],
      privateKey: ['', [Validators.required]]
    });
  }

  importPrivateKey() {
    if (this.privateKeyForm.invalid) {
      this.toastr.error('Invalid form! All fields are required');
      return;
    } else if (![KeyType.BlockSigningKey].includes(this.type.value)) {
      this.toastr.error('Invalid key type');
      return;
    } else if (this.type.value == KeyType.BlockSigningKey && !this.isValidPrivateBlockSigningKey(this.privateKey.value)) {
      this.toastr.error('Invalid Block Signing private key');
      return;
    }

    let privateKey = this.privateKey.value.startsWith('0x')
      ? this.privateKey.value.slice(2)
      : this.privateKey.value;

    let publicKey = this.keysService.getPublicKeyFromPrivate(SignatureType.EdDSA, Buffer.from(privateKey, 'hex'));

    const dialogMessage = 'Enter your vault password to import the key';
    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();
          this.vaultService
            .importKey(
              this.type.value,
              publicKey,
              privateKey,
              vaultPassword,
              this.nickname.value)
            .subscribe(result => {
              this.spinner.hide();
              if (result.success) {
                this.toastr.success(result.message);
                this.router.navigate(['keys/manage']);
              } else {
                this.toastr.error(result.message);
              }
            });

          this.createPrivateKeyForm();
        }
      });
  }

  goBack() {
    this.router.navigate(['keys/manage']);
  }

  get type() {
    return this.privateKeyForm.get('type');
  }

  get nickname() {
    return this.privateKeyForm.get('nickname');
  }

  get privateKey () {
    return this.privateKeyForm.get('privateKey');
  }

  private isValidPrivateBlockSigningKey(privateKey: string) {
    // The private Block Signing key must be a valid Ed25519 private key (32 bytes hex string),
    // optionally with a leading 0x
    return /^(0x)?[0-9a-fA-F]{64}$/.test(privateKey);
  }
}
