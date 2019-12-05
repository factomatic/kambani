import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { ActionType } from 'src/app/core/enums/action-type';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import { ClearCreateDIDState } from 'src/app/core/store/create-did/create-did.actions';
import { CloseFormScreen } from 'src/app/core/store/workflow/workflow.actions';
import { DIDDocument } from 'src/app/core/interfaces/did-document';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { DIDService } from 'src/app/core/services/did/did.service';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { EntryType } from 'src/app/core/enums/entry-type';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from 'src/app/components/dialogs/password/password.dialog.component';
import { ResultModel } from 'src/app/core/models/result.model';
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
  private didId: string;
  private didKeys: DidKeyModel[];
  private managementKeys: ManagementKeyModel[];
  public actionType = ActionType;
  public entry: DIDDocument | UpdateEntryDocument;
  public entryPretified: string;
  public selectedAction: string;
  
  constructor(
    private dialogsService: DialogsService,
    private didService: DIDService,
    private router: Router,
    private spinner: NgxSpinnerService,
    private store: Store<AppState>,
    private toastr: ToastrService,
    private vaultService: VaultService,
    private workflowService: WorkflowService) {
      super();
  }

  ngOnInit() {
    this.didId = this.didService.getId();
    this.selectedAction = this.workflowService.getSelectedAction();

    this.subscription = this.store
      .pipe(select(state => state))
      .subscribe(state => {
        this.managementKeys = state.createDID.managementKeys;
        this.didKeys = state.createDID.didKeys;
      });

    this.subscriptions.push(this.subscription);

    this.entry = this.didService.generateEntry(EntryType.CreateDIDEntry);
    this.entryPretified = JSON.stringify(this.entry, null, 2);
  }

  recordOnChain() {
    const dialogMessage = 'Enter your vault password to save your Digital Identity';

    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.spinner.show();
          this.vaultService
            .canDecryptVault(vaultPassword)
            .subscribe((result: ResultModel) => {
              if (result.success) {
                this.didService
                  .recordEntryOnChain(EntryType.CreateDIDEntry, this.entry)
                  .subscribe((recordResult: any) => {
                    if (recordResult.error) {
                      this.spinner.hide();
                      this.toastr.error(recordResult.message);
                    } else {
                      this.vaultService
                        .saveDIDToVault(
                          this.didId,
                          this.entry as DIDDocument,
                          this.managementKeys,
                          this.didKeys,
                          vaultPassword)
                        .subscribe((result: ResultModel) => {
                          this.spinner.hide();

                          if (result.success) {
                            this.store.dispatch(new ClearCreateDIDState());
                            this.store.dispatch(new CloseFormScreen());
                            this.toastr.success('You have successfully created a new Digital Identity');
                          } else {
                            /**
                            * this should never happen
                            */
                            this.toastr.error('A problem occurred! Please, try to create a new Digital Identity');
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

  goToPrevious() {
    this.workflowService.moveToPreviousStep();
  }
}
