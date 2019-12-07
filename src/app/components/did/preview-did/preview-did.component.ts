import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import * as updateDIDActions from 'src/app/core/store/update-did/update-did.actions';
import { AppState } from 'src/app/core/store/app.state';
import { BackupResultModel } from 'src/app/core/models/backup-result.model';
import { BaseComponent } from 'src/app/components/base.component';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { DIDService } from 'src/app/core/services/did/did.service';
import { downloadFile, minifyPublicKey, minifyDid } from 'src/app/core/utils/helpers';
import { EntryType } from 'src/app/core/enums/entry-type';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from 'src/app/components/dialogs/password/password.dialog.component';
import { PurposeType } from 'src/app/core/enums/purpose-type';
import { RemoveConfirmModalComponent } from 'src/app/components/modals/remove-confirm-modal/remove-confirm-modal.component';
import { ResultModel } from 'src/app/core/models/result.model';
import { ServiceModel } from 'src/app/core/models/service.model';
import { SharedRoutes } from 'src/app/core/enums/shared-routes';
import { SignatureResultModel } from 'src/app/core/models/signature-result.model';
import { SignatureType } from 'src/app/core/enums/signature-type';
import { SigningService } from 'src/app/core/services/signing/signing.service';
import { UpdateEntryDocument } from 'src/app/core/interfaces/update-entry-document';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-preview-did',
  templateUrl: './preview-did.component.html',
  styleUrls: ['./preview-did.component.scss']
})
export class PreviewDidComponent extends BaseComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
  private originalManagementKeys: ManagementKeyModel[];
  public MGMTKeysMode = 1;
  public DIDKeysMode = 2;
  public ServicesMode = 3;
  public minKey = minifyPublicKey;
  public minDid = minifyDid;
  public didId: string;
  public nickname: string;
  public managementKeys: ManagementKeyModel[];
  public didKeys: DidKeyModel[];
  public services: ServiceModel[];
  public formScreenOpen: boolean = false;
  public pendingChanges: boolean = false;
  public currentMode: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialogsService: DialogsService,
    private didService: DIDService,
    private modalService: NgbModal,
    private signingService: SigningService,
    private spinner: NgxSpinnerService,
    private store: Store<AppState>,
    private toastr: ToastrService,
    private vaultService: VaultService,
    private workflowService: WorkflowService ) {
      super();
    }

  ngOnInit() {
    this.didId = this.route.snapshot.paramMap.get('id');
    this.didService.loadDIDForUpdate(this.didId);
    const didPublicInfo = this.vaultService.getDIDPublicInfo(this.didId);
    this.nickname = didPublicInfo.nickname;
    this.currentMode = this.MGMTKeysMode;

    this.workflowService.closeFormEvent.subscribe(() => {
      this.closeFormScreen();
    });

    this.subscription = this.store
      .pipe(select(state => state.updateDID))
      .subscribe(updateDIDState => {
        const didUpdateModel = updateDIDState.dids.find(d => d.didId === this.didId);
        if (didUpdateModel) {
          this.managementKeys = didUpdateModel.managementKeys;
          this.originalManagementKeys = didUpdateModel.originalManagementKeys;
          this.didKeys = didUpdateModel.didKeys;
          this.services = didUpdateModel.services;

          if (JSON.stringify(didUpdateModel.originalManagementKeys) !== JSON.stringify(didUpdateModel.managementKeys)
            || JSON.stringify(didUpdateModel.originalDidKeys) !== JSON.stringify(didUpdateModel.didKeys)
            || JSON.stringify(didUpdateModel.originalServices) !== JSON.stringify(didUpdateModel.services)) {
              this.pendingChanges = true;
          } else {
            this.pendingChanges = false;
          }
        }
      });

    this.subscriptions.push(this.subscription);
  }

  ngOnDestroy() {
    this.didService.clearData();
  }

  saveChanges() {
    if (this.pendingChanges) {
      if (this.managementKeys.filter(mk => mk.priority == 0).length == 0) {
        this.toastr.error("You must have at least one Management key at priority 0 before continuing", null, {timeOut: 5000});
        return;
      }

      const entry = this.didService.generateEntry(EntryType.UpdateDIDEntry);
      const signingKey = this.originalManagementKeys.filter(k => k.priority == 0)[0];
      const signingKeyId = `${this.didId}#${signingKey.alias}`;
      const dialogMessage = 'Enter your vault password to sign the entry and update any key(s)';

      this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
        .subscribe((vaultPassword: string) => {
          if (vaultPassword) {
            this.spinner.show();
            this.signingService
              .signDIDEntry(signingKeyId, signingKey.type as SignatureType, entry, EntryType.UpdateDIDEntry, vaultPassword)
              .subscribe((result: SignatureResultModel) => {
                if (result.success) {
                  this.didService
                    .recordEntryOnChain(
                      EntryType.UpdateDIDEntry,
                      entry,
                      signingKeyId,
                      result.signatureBase64)
                    .subscribe((recordResult: any) => {
                      if (recordResult.error) {
                        this.spinner.hide();
                        this.toastr.error(recordResult.message);
                      } else {
                        this.vaultService
                          .saveDIDChangesToVault(
                            this.didId,
                            entry as UpdateEntryDocument,
                            this.managementKeys,
                            this.didKeys,
                            vaultPassword)
                          .subscribe((result: ResultModel) => {
                            this.spinner.hide();

                            if (result.success) {
                              this.store.dispatch(new updateDIDActions.CompleteDIDUpdate(this.didId));
                              this.toastr.success('Identity updated successfully');
                              this.router.navigate([SharedRoutes.ManageDids]);
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
  }

  cancelChanges() {
    this.store.dispatch(new updateDIDActions.CancelChanges(this.didId));
  }

  closeFormScreen() {
    this.formScreenOpen = false;
  }

  removeManagementKey(key: ManagementKeyModel) {
    const confirmRef = this.modalService.open(RemoveConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'key';
    confirmRef.result.then((result) => {
      this.store.dispatch(new updateDIDActions.RemoveManagementKey(this.didId, key));
    }).catch((error) => {
    });
  }

  removeDIDKey(key: DidKeyModel) {
    const confirmRef = this.modalService.open(RemoveConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'key';
    confirmRef.result.then((result) => {
      this.store.dispatch(new updateDIDActions.RemoveDIDKey(this.didId, key));
    }).catch((error) => {
    });
  }

  removeService(service: ServiceModel) {
    const confirmRef = this.modalService.open(RemoveConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'service';
    confirmRef.result.then((result) => {
      this.store.dispatch(new updateDIDActions.RemoveService(this.didId, service));
    }).catch((error) => {
    });
  }

  displayPurposes(purposes: any[]): string {
    if (purposes.includes(PurposeType.PublicKey) && purposes.includes(PurposeType.AuthenticationKey)) {
      return 'Public Key, Authentication Key';
    } else if (purposes.includes(PurposeType.PublicKey)) {
      return 'Public Key';
    } else if (purposes.includes(PurposeType.AuthenticationKey)) {
      return 'Authentication Key';
    }
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

  removeDid(didId: string) {
    const signingKey = this.originalManagementKeys.filter(k => k.priority == 0)[0];
    const signingKeyId = `${this.didId}#${signingKey.alias}`;
    const deactivateEntry = "";
    const dialogMessage = 'Enter your vault password to sign the entry and delete the Identity';

    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();
          this.signingService
            .signDIDEntry(signingKeyId, signingKey.type as SignatureType, deactivateEntry, EntryType.DeactivateDIDEntry, vaultPassword)
            .subscribe((result: SignatureResultModel) => {
              if (result.success) {
                this.didService
                  .recordEntryOnChain(
                    EntryType.DeactivateDIDEntry,
                    deactivateEntry,
                    signingKeyId,
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
                            this.store.dispatch(new updateDIDActions.CompleteDIDUpdate(didId));
                            this.toastr.success(result.message);
                            this.router.navigate([SharedRoutes.ManageDids]);
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
