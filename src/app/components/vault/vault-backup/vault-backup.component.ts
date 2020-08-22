import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import {
  accessOrModifyVault,
  downloadFile,
  postProcessEncryptedBackupFile,
  generateBackupFileName
} from 'src/app/core/utils/helpers';
import { BackupResultModel } from 'src/app/core/models/backup-result.model';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
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
    accessOrModifyVault(this, this.vaultService, this.dialogsService, dialogMessage, this.downloadBackupFile);
  }

  private downloadBackupFile(that: any, vaultPassword: string) {
    that.vaultService.getEncryptedState(vaultPassword)
      .subscribe((backupResult: BackupResultModel) =>{
        if (backupResult.success) {
          const backupFile = postProcessEncryptedBackupFile(backupResult.backup);
          const backupFileName = generateBackupFileName();
          downloadFile(backupFile, backupFileName);
          that.toastr.success(backupResult.message);
        } else {
          that.toastr.error(backupResult.message);
        }
      });
  }
}
