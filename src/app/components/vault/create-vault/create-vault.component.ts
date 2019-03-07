import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import CustomValidators from 'src/app/core/utils/customValidators';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-create-vault',
  templateUrl: './create-vault.component.html',
  styleUrls: ['./create-vault.component.scss']
})
export class CreateVaultComponent implements OnInit {
  protected createVaultForm;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastr: ToastrService,
    private vaultService: VaultService) { }

  ngOnInit() {
    this.createVaultForm = this.fb.group({
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: CustomValidators.passwordsDoMatch.bind(this)});
  }

  createVault() {
    if (this.createVaultForm.invalid) {
      return;
    }

    this.vaultService
      .createNewVault(this.password.value)
      .subscribe(() => {
        this.toastr.success('You have successfully created new vault');
        this.router.navigate(['home']);
      });
  }

  get password () {
    return this.createVaultForm.get('password');
  }

  get confirmPassword() {
    return this.createVaultForm.get('confirmPassword');
  }
}
