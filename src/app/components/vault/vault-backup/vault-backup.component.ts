import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { BackupResultModel } from 'src/app/core/models/backup-result.model';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { downloadFile, postProcessEncryptedBackupFile, generateBackupFileName } from 'src/app/core/utils/helpers';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from '../../dialogs/password/password.dialog.component';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-vault-backup',
  templateUrl: './vault-backup.component.html',
  styleUrls: ['./vault-backup.component.scss']
})
export class VaultBackupComponent implements OnInit {
  public anyDIDsOrAddresses: boolean;

  constructor(
    private dialogsService: DialogsService,
    private toastr: ToastrService,
    private vaultService: VaultService) { }

  ngOnInit() {
    this.anyDIDsOrAddresses = this.vaultService.anyDIDsOrAddresses();
  }

  backupVault() {
    const dialogMessage = 'Enter your vault password to encrypt the backup file';

    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.vaultService.getEncryptedState(vaultPassword)
            .subscribe((backupResult: BackupResultModel) =>{
              if (backupResult.success) {
                const backupFile = postProcessEncryptedBackupFile(backupResult.backup);
                const backupFileName = generateBackupFileName();
                downloadFile(backupFile, backupFileName);
                this.toastr.success(backupResult.message);
              } else {
                this.toastr.error(backupResult.message);
              }
            });
        }
      });
  }
}
