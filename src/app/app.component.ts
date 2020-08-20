import { Component, OnInit, NgZone } from '@angular/core';
import { HostListener } from "@angular/core";
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';

import { AppState } from './core/store/app.state';
import { BackupDialogComponent } from './components/dialogs/backup/backup.dialog.component';
import { BackupResultModel } from './core/models/backup-result.model';
import { ChromeMessageType } from './core/enums/chrome-message-type';
import { DialogsService } from './core/services/dialogs/dialogs.service';
import { downloadFile, postProcessEncryptedBackupFile, generateBackupFileName } from './core/utils/helpers';
import { ModalSizeTypes } from './core/enums/modal-size-types';
import { PasswordDialogComponent } from './components/dialogs/password/password.dialog.component';
import { VaultService } from './core/services/vault/vault.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private pendingChanges: boolean;

  constructor(
    private dialogsService: DialogsService,
    public vaultService: VaultService,
    public router: Router,
    private store: Store<AppState>,
    private toastr: ToastrService,
    private zone: NgZone) { }

  ngOnInit() {
    try {
      chrome.runtime.sendMessage({type: ChromeMessageType.CheckRequests}, (checkRequestsResponse) => {
        if (checkRequestsResponse.restoreVaultRequested) {
          this.zone.run(() => {
            this.router.navigate(['/vault/restore']);
          });
        } else if (checkRequestsResponse.manageDidsRequested) {
          this.zone.run(() => {
            this.router.navigate(['/dids/manage']);
          });
        } else if (checkRequestsResponse.manageFactomAddressesRequested) {
          this.zone.run(() => {
            this.router.navigate(['/factom/addresses/manage']);
          });
        } else if (checkRequestsResponse.manageKeysRequested) {
          this.zone.run(() => {
            this.router.navigate(['/keys/manage']);
          });
        } else if (checkRequestsResponse.approvalRequests) {
          this.zone.run(() => {
            this.router.navigate(['approve']);
          });
        } else if (checkRequestsResponse.settingsRequested) {
          this.zone.run(() => {
            this.router.navigate(['settings']);
          });
        } else {
          chrome.runtime.sendMessage({type: ChromeMessageType.PendingSigningRequestsCount}, (pendingRequestsResponse) => {
            this.zone.run(() => {
              const pendingRequests = pendingRequestsResponse.pendingSigningRequestsCount;
              chrome.browserAction.getBadgeText({}, function(result) {
                if (parseInt(result) !== pendingRequests) {
                  chrome.browserAction.setBadgeText({text: pendingRequests.toString()});
                }
              });

              if (pendingRequests > 0) {
                this.router.navigate(['signer']);
              }
            });
          });
        }
      });
    }
    catch(err){
      console.error("This app should run as a Chrome extension.");
      throw(err);
    }

    if (this.vaultService.vaultExists()) {
      this.vaultService.updateSignedRequestsData();
      if (this.vaultService.upgradeStorageVersion()) {
        this.dialogsService.open(BackupDialogComponent, ModalSizeTypes.ExtraExtraLarge, undefined)
          .subscribe(() => {
            this.backupVault();
          });
      }
    }

    this.store
      .pipe(select(state => state.updateDID))
      .subscribe(updateDIDState => {
        if (updateDIDState.didsWithPendingChanges.length > 0) {
          this.pendingChanges = true;
        } else {
          this.pendingChanges = false;
        }
      });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.pendingChanges) {
      $event.returnValue = true;
    }
  }

  private backupVault() {
    const dialogMessage = 'Enter your vault password to encrypt the backup file';

    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.vaultService.getEncryptedState(vaultPassword)
            .subscribe((backupResult: BackupResultModel) => {
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
