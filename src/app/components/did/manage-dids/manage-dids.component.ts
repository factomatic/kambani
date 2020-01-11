import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { AppState } from 'src/app/core/store/app.state';
import { BackupResultModel } from 'src/app/core/models/backup-result.model';
import { BaseComponent } from '../../base.component';
import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { ClearCreateDIDState } from 'src/app/core/store/create-did/create-did.actions';
import { ClearWorkflowState } from 'src/app/core/store/workflow/workflow.actions';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import { CompleteDIDUpdate } from 'src/app/core/store/update-did/update-did.actions';
import { CreateDIDState } from 'src/app/core/store/create-did/create-did.state';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { DIDDocument } from 'src/app/core/interfaces/did-document';
import { DIDService } from 'src/app/core/services/did/did.service';
import { downloadFile } from 'src/app/core/utils/helpers';
import { EntryType } from 'src/app/core/enums/entry-type';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from '../../dialogs/password/password.dialog.component';
import { ResultModel } from 'src/app/core/models/result.model';
import { SignatureResultModel } from 'src/app/core/models/signature-result.model';
import { SignatureType } from 'src/app/core/enums/signature-type';
import { SigningService } from 'src/app/core/services/signing/signing.service';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-manage-dids',
  templateUrl: './manage-dids.component.html',
  styleUrls: ['./manage-dids.component.scss']
})
export class ManageDidsComponent extends BaseComponent implements OnInit {
  private subscription: Subscription;
  private createDIDState: CreateDIDState;
  public didIds: string[] = [];
  public displayedDidIds: string[] = [];
  public allDIDsPublicInfo: object;
  public formScreenOpen: boolean = false;
  public pageSize: number = 6;
  public didEditNickname: boolean[] = [];
  public currentPage: number = 1;
  public currentStartIndex = 0;

  constructor(
    private dialogsService: DialogsService,
    private didService: DIDService,
    private modalService: NgbModal,
    private router: Router,
    private signingService: SigningService,
    private spinner: NgxSpinnerService,
    private store: Store<AppState>,
    private toastr: ToastrService,
    private vaultService: VaultService) {
      super();
    }

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

    this.subscription = this.store
      .pipe(select(state => state))
      .subscribe(state => {
        this.createDIDState = state.createDID;
        
        if (state.workflow.closeFormScreen) {
          this.clearState();
        }
      });

    this.subscriptions.push(this.subscription);
  }

  backupDid(didId: string) {
    const dialogMessage = 'Enter your vault password to open the vault and encrypt your Identity';

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

  previewDid(didId: string) {
    this.didService.loadDIDForUpdate(didId);
    this.router.navigate([`dids/preview/${didId}`]);
  }

  removeDid(didId: string) {
    const didDocument = this.allDIDsPublicInfo[didId].didDocument as DIDDocument;
    const signingKey = didDocument.managementKey.filter(k => k.priority == 0)[0];
    const signingKeyType = signingKey.type.split('VerificationKey')[0] as SignatureType;
    const deactivateEntry = "";
    const dialogMessage = 'Enter your vault password to sign the entry and delete the Identity';

    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();
          this.signingService
            .signDIDEntry(signingKey.id, signingKeyType, deactivateEntry, EntryType.DeactivateDIDEntry, vaultPassword)
            .subscribe((result: SignatureResultModel) => {
              if (result.success) {
                this.didService
                  .recordEntryOnChain(
                    EntryType.DeactivateDIDEntry,
                    deactivateEntry,
                    signingKey.id,
                    result.signatureBase64)
                  .subscribe((recordResult: any) => {
                    if (recordResult.error) {
                      this.spinner.hide();
                      this.toastr.error(recordResult.message);
                    } else {
                      this.vaultService
                        .removeDIDFromVault(
                          didId,
                          vaultPassword)
                        .subscribe((result: ResultModel) => {
                          this.spinner.hide();

                          if (result.success) {
                            this.getDIDsInfo();
                            this.store.dispatch(new CompleteDIDUpdate(didId));
                            this.toastr.success(result.message);
                          } else {
                            /**
                            * this should never happen
                            */
                            this.toastr.error('A problem occurred! Please, try again');
                          }
                        });
                    }        
                  });
              } else {
                this.spinner.hide();
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

  closeFormScreen() {
    if (this.createDIDState.managementKeys.length > 0
      || this.createDIDState.didKeys.length > 0
      || this.createDIDState.services.length > 0) {
        const confirmRef = this.modalService.open(ConfirmModalComponent);
        confirmRef.result.then((result) => {
          this.clearState();
          this.store.dispatch(new ClearCreateDIDState());
        }).catch((error) => {
        });
    } else {
      this.clearState();
    }
  }

  searchChange(event) {
    const searchTerm = event.target.value;
    this.didIds = [];
    for (const didId in this.allDIDsPublicInfo) {
      if (this.allDIDsPublicInfo[didId].nickname.includes(searchTerm)) {
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

  copyDIDId(didId: string, element) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = didId;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    element.classList.add('clicked');
    setTimeout(() => {element.classList.remove('clicked')},2000);
  }

  private clearState() {
    this.formScreenOpen = false;
    this.getDIDsInfo();
    this.didService.clearData();
    this.store.dispatch(new ClearWorkflowState());
    this.router.navigate(['dids/manage']);
  }

  private getDIDsInfo() {
    this.allDIDsPublicInfo = this.vaultService.getAllDIDsPublicInfo();
    this.didIds = Object.keys(this.allDIDsPublicInfo);
    this.displayedDidIds = this.didIds.slice(this.currentStartIndex, this.currentStartIndex + this.pageSize);
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
