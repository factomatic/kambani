import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { BackupDialogComponent } from '../../dialogs/backup/backup.dialog.component';
import { BackupResultModel } from 'src/app/core/models/backup-result.model';
import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { downloadFile, preProcessEncryptedBackupFile, postProcessEncryptedBackupFile, generateBackupFileName } from 'src/app/core/utils/helpers';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from '../../dialogs/password/password.dialog.component';
import { RestoreResultModel } from 'src/app/core/models/restore-result.model';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-restore-vault',
  templateUrl: './restore-vault.component.html',
  styleUrls: ['./restore-vault.component.scss']
})
export class RestoreVaultComponent implements OnInit {
  public backupPasswordForm;
  public file: string;

  constructor(
    private fb: FormBuilder,
    private dialogsService: DialogsService,
    private vaultService: VaultService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private router: Router) { }

  ngOnInit() {
    chrome.tabs.getCurrent(function(tab) {
      if (tab === undefined) {
        chrome.runtime.getPlatformInfo(function(info) {
          if (info.os !== 'win') {
            chrome.runtime.sendMessage({type: ChromeMessageType.RestoreVaultRequest}, (response) => {
              if (response.success) {
                const popup_url = chrome.runtime.getURL('index.html');
                chrome.tabs.create({'url': popup_url});
              }
            });
          }
        });
      } else {
        chrome.runtime.sendMessage({type: ChromeMessageType.CheckRequests}, (response) => {
          if (response.restoreVaultRequested) {
            chrome.runtime.sendMessage({type: ChromeMessageType.NewTabOpen});
          }
        });
      }
    });

    this.backupPasswordForm = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  importVault() {
    if (this.backupPasswordForm.invalid || !this.file) {
      return;
    }

    this.spinner.show();
    const backupFile = preProcessEncryptedBackupFile(this.file);
    this.vaultService
      .restoreVault(backupFile, this.password.value)
      .subscribe((result: RestoreResultModel) => {
        if (result.success) {
          this.spinner.hide();
          if (result.versionUpgraded) {
            this.dialogsService.open(BackupDialogComponent, ModalSizeTypes.ExtraExtraLarge, undefined)
              .subscribe(() => {
                this.backupVault();
              });
          } else {
            this.toastr.success(result.message);
          }
          
          this.router.navigate(['home']);
        } else {
          this.spinner.hide();
          this.toastr.error(result.message);
          this.backupPasswordForm.reset();
        }
      });
  }

  get password () {
    return this.backupPasswordForm.get('password');
  }

  handleFileInput(files) {
    if (files && files.length > 0) {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        this.file = fileReader.result.toString();
      };

      fileReader.readAsText(files[0]);
    }
  }

  private backupVault() {
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
