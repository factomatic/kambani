/// <reference types="chrome" />

import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';

import { ActionType } from 'src/app/core/enums/action-type';
import { AppState } from 'src/app/core/store/app.state';
import { BackupResultModel } from 'src/app/core/models/backup-result.model';
import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { DIDService } from 'src/app/core/services/did/did.service';
import { downloadFile } from 'src/app/core/utils/helpers';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from '../../dialogs/password/password.dialog.component';
import { SelectAction } from 'src/app/core/store/action/action.actions';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-manage-dids',
  templateUrl: './manage-dids.component.html',
  styleUrls: ['./manage-dids.component.scss']
})
export class ManageDidsComponent implements OnInit {
  public didIds: string[] = [];
  public displayedDidIds: string[] = [];
  public allDIDsPublicInfo: object;
  public formScreenOpen: boolean = false;
  public pageSize: number = 10;
  public didEditNickname: boolean[] = [];
  public currentPage: number = 1;
  public currentStartIndex = 0;

  constructor(
    private dialogsService: DialogsService,
    private didService: DIDService,
    private store: Store<AppState>,
    private toastr: ToastrService,
    private vaultService: VaultService,
    private workflowService: WorkflowService) { }

  ngOnInit() {
    chrome.tabs && chrome.tabs.getCurrent(function(tab) {
      if (tab === undefined) {
        chrome.runtime.sendMessage({type: ChromeMessageType.ManageDidsRequest}, (response) => {
          if (response.success) {
            const popup_url = chrome.runtime.getURL('index.html');
            chrome.tabs.create({'url': popup_url});
          }
        });
      } else {
        chrome.runtime.sendMessage({type: ChromeMessageType.CheckRequests}, (response) => {
          if (response.manageDidsRequested) {
            chrome.runtime.sendMessage({type: ChromeMessageType.NewTabOpen});
          }
        });
      }
    });

    this.getDIDsInfo();
  }

  backupDid(didId: string) {
    const dialogMessage = 'Enter your vault password to open the vault and encrypt your DID';

    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.vaultService
            .backupSingleDIDFromVault(didId, vaultPassword)
            .subscribe((result: BackupResultModel) => {
              if (result.success) {
                const date = new Date();
                const didBackupFile = this.postProcessDidBackupFile(result.backup, didId);
                downloadFile(didBackupFile, `paper-did-UTC--${date.toISOString()}.txt`);
              } else {
                this.toastr.error(result.message);
              }
            });
        }
      });
  }

  editNickname(didId: string, nickname: string) {
    this.vaultService.updateDIDNickname(didId, nickname);
    this.allDIDsPublicInfo[didId].nickname = nickname;
    this.didEditNickname[didId] = false;
  }

  updateDid(didId: string) {
    this.store.dispatch(new SelectAction(ActionType.Update));
    this.didService.loadDIDForUpdate(didId);
    this.workflowService.moveToNextStep();
    this.formScreenOpen = true;
  }

  closeFormScreen() {
    this.formScreenOpen = false;
    this.getDIDsInfo();
  }

  search(searchTerm: string) {
    this.didIds = [];
    for (const didId in this.allDIDsPublicInfo) {
      if (didId.includes(searchTerm)) {
        this.didIds.push(didId);
      } else if (this.allDIDsPublicInfo[didId].nickname.includes(searchTerm)) {
        this.didIds.push(didId);
      }
    }

    this.currentStartIndex = 0;
    this.currentPage = 1;
    this.displayedDidIds = this.didIds.slice(this.currentStartIndex, this.currentStartIndex + this.pageSize);
  }

  changePage (page) {
    this.currentPage = page;
    this.currentStartIndex = (this.currentPage - 1) * this.pageSize;
    this.displayedDidIds = this.didIds.slice(this.currentStartIndex, this.currentStartIndex + this.pageSize);
  }

  anyDID() {
    return Object.keys(this.allDIDsPublicInfo).length > 0;
  }

  private getDIDsInfo() {
    this.allDIDsPublicInfo = this.vaultService.getAllDIDsPublicInfo();
    this.didIds = Object.keys(this.allDIDsPublicInfo);
    this.displayedDidIds = this.didIds.slice(this.currentStartIndex, this.currentStartIndex + this.pageSize);

    for(const didId in this.displayedDidIds) {
      this.didEditNickname[didId] = false;
    }
  }

  private postProcessDidBackupFile(encryptedFile: string, didId: string) {
    const parsedFile = JSON.parse(encryptedFile);
    const newKeysFile: any = { };

    newKeysFile.data = parsedFile.data;
    newKeysFile.encryptionAlgo = {
      name: 'AES-GCM',
      iv: parsedFile.iv,
      salt: parsedFile.salt,
      tagLength: 128
    };
    newKeysFile.did = didId;

    return JSON.stringify(newKeysFile, null, 2);
  }
}
