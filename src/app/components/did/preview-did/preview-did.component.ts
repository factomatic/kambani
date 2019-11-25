import { ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import { ConfirmModalComponent } from 'src/app/components/modals/confirm-modal/confirm-modal.component';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { DIDService } from 'src/app/core/services/did/did.service';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { minifyPublicKey, minifyDid } from 'src/app/core/utils/helpers';
import { RemoveService, RemoveManagementKey, RemoveDidKey } from 'src/app/core/store/form/form.actions';
import { ServiceModel } from 'src/app/core/models/service.model';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-preview-did',
  templateUrl: './preview-did.component.html',
  styleUrls: ['./preview-did.component.scss']
})
export class PreviewDidComponent extends BaseComponent implements OnInit, OnDestroy {
  private subscription: Subscription;
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
    private didService: DIDService,
    private modalService: NgbModal,
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
      .pipe(select(state => state.form))
      .subscribe(form => {
        this.managementKeys = form.managementKeys;
        this.didKeys = form.didKeys;
        this.services = form.services;

        if (JSON.stringify(form.originalManagementKeys) !== JSON.stringify(form.managementKeys)
          || JSON.stringify(form.originalDidKeys) !== JSON.stringify(form.didKeys)
          || JSON.stringify(form.originalServices) !== JSON.stringify(form.services)) {
            this.pendingChanges = true;
        } else {
          this.pendingChanges = false;
        }
      });

    this.subscriptions.push(this.subscription);
  }

  ngOnDestroy() {
    this.didService.clearData();
  }

  saveChanges() {
    if (this.pendingChanges) {

    }
  }

  closeFormScreen() {
    this.formScreenOpen = false;
  }

  removeManagementKey(key: ManagementKeyModel) {
    if (this.managementKeys.filter(mk => mk.priority == 0).length == 1 && key.priority == 0) {
      this.toastr.error("You can not revoke all Management Keys at priority 0", null, {timeOut: 5000});
      return;
    }

    const confirmRef = this.modalService.open(ConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'key';
    confirmRef.result.then((result) => {
      this.store.dispatch(new RemoveManagementKey(key));
    }).catch((error) => {
    });
  }

  removeDIDKey(key: DidKeyModel) {
    const confirmRef = this.modalService.open(ConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'key';
    confirmRef.result.then((result) => {
      this.store.dispatch(new RemoveDidKey(key));
    }).catch((error) => {
    });
  }

  removeService(service: ServiceModel) {
    const confirmRef = this.modalService.open(ConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'service';
    confirmRef.result.then((result) => {
      this.store.dispatch(new RemoveService(service));
    }).catch((error) => {
    });
  }
}
