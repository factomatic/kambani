declare const Buffer;
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { isValidPrivateFctAddress, isValidPrivateEcAddress, getPublicAddress } from 'factom';

import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { FactomAddressType } from 'src/app/core/enums/factom-address-type';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from '../../dialogs/password/password.dialog.component';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-import-address',
  templateUrl: './import-address.component.html',
  styleUrls: ['./import-address.component.scss']
})
export class ImportAddressComponent implements OnInit {
  public privateAddressForm: FormGroup;
  private selectedType: string;

  constructor(
    private dialogsService: DialogsService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private vaultService: VaultService ) { }

  ngOnInit() {
    this.selectedType = this.route.snapshot.paramMap.get('type');
    if (this.selectedType != FactomAddressType.FCT && this.selectedType != FactomAddressType.EC) {
      this.selectedType = FactomAddressType.FCT;
    }

    this.createPrivateAddressForm();
  }

  createPrivateAddressForm() {
    this.privateAddressForm = this.fb.group({
      type: [this.selectedType, Validators.required],
      nickname: ['', Validators.required],
      privateAddress: ['', [Validators.required]]
    });
  }

  importPrivateAddress() {
    if (this.privateAddressForm.invalid) {
      this.toastr.error('Invalid form! All fields are required');
      return;
    } else if (this.type.value != FactomAddressType.FCT && this.type.value != FactomAddressType.EC) {
      this.toastr.error('Invalid address type');
      return;
    } else if (this.type.value == FactomAddressType.FCT && !isValidPrivateFctAddress(this.privateAddress.value)) {
      this.toastr.error('Invalid FCT private address');
      return;
    } else if (this.type.value == FactomAddressType.EC && !isValidPrivateEcAddress(this.privateAddress.value)) {
      this.toastr.error('Invalid EC private address');
      return;
    }

    const publicAddress = getPublicAddress(this.privateAddress.value);
    const dialogMessage = 'Enter your vault password to import the address';
    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();
          this.vaultService
            .importFactomAddress(
              this.type.value,
              publicAddress,
              this.privateAddress.value,
              vaultPassword,
              this.nickname.value)
            .subscribe(result => {
              this.spinner.hide();
              if (result.success) {
                this.toastr.success(result.message);
                this.router.navigate(['factom/addresses/manage']);
              } else {
                this.toastr.error(result.message);
              }
            });

          this.createPrivateAddressForm();
        }
      });
  }

  get type() {
    return this.privateAddressForm.get('type');
  }

  get nickname() {
    return this.privateAddressForm.get('nickname');
  }

  get privateAddress () {
    return this.privateAddressForm.get('privateAddress');
  }
}
