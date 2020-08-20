import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { LockActionType } from 'src/app/core/enums/lock-action-type';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { ResultModel } from 'src/app/core/models/result.model';
import { PasswordDialogComponent } from '../../dialogs/password/password.dialog.component';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-unlock-vault',
  templateUrl: './unlock-vault.component.html',
  styleUrls: ['./unlock-vault.component.scss']
})
export class UnlockVaultComponent implements OnInit {
  public action: LockActionType;
  public message: string;

  constructor(
    private dialogsService: DialogsService,
    private router: Router,
    private toastr: ToastrService,
    private vaultService: VaultService) { }

  ngOnInit() {
    if (this.vaultService.getVaultPassword()) {
      this.action = LockActionType.Lock;
      this.message = 'You are about to lock your vault. You will not be able to sign any requests without entering your password.';
    } else {
      this.action = LockActionType.Unlock;
      this.message = 'You are about to unlock your vault. The extension will store your password until you lock it back again.';
    }
  }

  changeVaultLockState() {
    if (this.action == LockActionType.Unlock) {
      const dialogMessage = `Enter your vault password to unlock the vault`;

      this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
        .subscribe((vaultPassword: string) => {
          if (vaultPassword) {
            this.savePassword(vaultPassword);
          }
        });
    } else {
      this.savePassword(undefined);
    }
  }

  private savePassword(vaultPassword: string) {
    this.vaultService.savePassword(vaultPassword)
      .subscribe((result: ResultModel) => {
        if (result.success) {
          this.router.navigate(['/home']);
          this.toastr.success(result.message);
        } else {
          this.toastr.error(result.message);
        }
      });
  }
}
