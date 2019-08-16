import { Component, OnInit } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { ActionType } from 'src/app/core/enums/action-type';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import { DIDDocument } from 'src/app/core/interfaces/did-document';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { DIDService } from 'src/app/core/services/did/did.service';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { EntryType } from 'src/app/core/enums/entry-type';
import { ManagementKeyEntryModel } from 'src/app/core/interfaces/management-key-entry';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from 'src/app/components/dialogs/password/password.dialog.component';
import { ResultModel } from 'src/app/core/models/result.model';
import { SignatureResultModel } from 'src/app/core/models/signature-result.model';
import { SigningService } from 'src/app/core/services/signing/signing.service';
import { SharedRoutes } from 'src/app/core/enums/shared-routes';
import { UpdateEntryDocument } from 'src/app/core/interfaces/update-entry-document';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent extends BaseComponent implements OnInit {
  private subscription: Subscription;
  private didKeys: DidKeyModel[];
  private managementKeys: ManagementKeyModel[];
  public actionType = ActionType;
  public availableManagementKeys: ManagementKeyEntryModel[];
  public entry: DIDDocument | UpdateEntryDocument;
  public entryPretified: string;
  public entryType: string;
  public recordOnChainButtonName = 'Record on-chain';
  public selectedAction: string;
  public selectedManagementKeyId: string;
  public anyDIDChangesMade: boolean = false;
  
  constructor(
    private deviceService: DeviceDetectorService,
    private dialogsService: DialogsService,
    private didService: DIDService,
    private router: Router,
    private signingService: SigningService,
    private spinner: NgxSpinnerService,
    private store: Store<AppState>,
    private toastr: ToastrService,
    private vaultService: VaultService,
    private workflowService: WorkflowService) {
      super();
  }

  ngOnInit() {
    this.subscription = this.store
      .pipe(select(state => state.form))
      .subscribe(form => {
        this.managementKeys = form.managementKeys;
        this.didKeys = form.didKeys;
      });

    this.subscriptions.push(this.subscription);

    if (this.deviceService.isMobile()) {
      this.recordOnChainButtonName = 'Record';
    }

    this.selectedAction = this.workflowService.getSelectedAction();
    this.entryType = this.selectedAction === ActionType.Update ? EntryType.UpdateDIDEntry : EntryType.CreateDIDEntry;
    this.entry = this.didService.generateEntry(this.entryType);
    this.entryPretified = JSON.stringify(this.entry, null, 2);
    
    if (this.entryType == EntryType.UpdateDIDEntry) {
      if (Object.keys(this.entry).length > 0)
      {
        this.anyDIDChangesMade = true;
        this.availableManagementKeys = this.signingService.getAvailableManagementKeysForSigning(this.didService.getId(), this.entry as UpdateEntryDocument);

        if (this.availableManagementKeys.length > 0) {
          this.selectedManagementKeyId = this.availableManagementKeys[0].id;
        }
      }
    }
  }

  recordOnChain() {
    if (this.selectedAction === ActionType.Update) {
      this.recordUpdateEntryOnChain();
    } else {
      this.recordCreateEntryOnChain();
    }
  }

  recordCreateEntryOnChain() {
    const dialogMessage = 'Enter your vault password to save your key(s) before recording the DID on-chain';

    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();
          this.vaultService
            .canDecryptVault(vaultPassword)
            .subscribe((result: ResultModel) => {
              if (result.success) {
                this.didService
                  .recordCreateEntryOnChain(this.entry as DIDDocument)
                  .subscribe((recordResult: any) => {
                    if (recordResult.error) {
                      this.spinner.hide();
                      this.toastr.error(recordResult.message);
                    } else {
                      this.vaultService
                        .saveDIDToVault(
                          this.didService.getId(),
                          this.entry as DIDDocument,
                          this.managementKeys,
                          this.didKeys,
                          vaultPassword)
                        .subscribe((result: ResultModel) => {
                          this.spinner.hide();

                          if (result.success) {
                            const didId = this.didService.getId();
                            this.didService.clearData();
                            this.workflowService.moveToNextStep({ queryParams: { url: recordResult.url, didId: didId } });
                          } else {
                            /**
                            * this should never happen
                            */
                            this.toastr.error('A problem occurred! Please, try to create a new DID.');
                            this.router.navigate([SharedRoutes.ManageDids]);
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

  recordUpdateEntryOnChain() {
    const selectedManagementKey = this.availableManagementKeys.find(k => k.id === this.selectedManagementKeyId);
    if (selectedManagementKey) {
      const dialogMessage = 'Enter your vault password to sign the entry and save any new key(s) before recording the entry on-chain';

      this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
        .subscribe((vaultPassword: string) => {
          if (vaultPassword) {
            this.spinner.show();
            this.signingService
              .signUpdateEntry(this.didService.getId(), selectedManagementKey, this.entry as UpdateEntryDocument, vaultPassword)
              .subscribe((result: SignatureResultModel) => {
                if (result.success) {
                  this.didService
                    .recordUpdateEntryOnChain(
                      this.entry as UpdateEntryDocument,
                      this.selectedManagementKeyId,
                      result.signatureBase64)
                    .subscribe((recordResult: any) => {
                      if (recordResult.error) {
                        this.spinner.hide();
                        this.toastr.error(recordResult.message);
                      } else {
                        this.vaultService
                          .saveDIDChangesToVault(
                            this.didService.getId(),
                            this.entry as UpdateEntryDocument,
                            this.managementKeys,
                            this.didKeys,
                            vaultPassword)
                          .subscribe((result: ResultModel) => {
                            this.spinner.hide();
  
                            if (result.success) {
                              const didId = this.didService.getId();
                              this.didService.clearData();
                              this.workflowService.moveToNextStep({ queryParams: { url: recordResult.url, didId: didId } });
                            } else {
                              /**
                              * this should never happen
                              */
                              this.toastr.error('A problem occurred! Please, try to create a new DID.');
                              this.router.navigate([SharedRoutes.ManageDids]);
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

  onSelectChange(selectedManagementKeyId: string) {
    this.selectedManagementKeyId = selectedManagementKeyId;
  }

  goToPrevious() {
    this.workflowService.moveToPreviousStep();
  }
}
