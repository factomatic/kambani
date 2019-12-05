import { CollapseComponent } from 'angular-bootstrap-md';
import { Component, OnInit, AfterViewInit, ViewChildren, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { ActionType } from 'src/app/core/enums/action-type';
import { AddManagementKey, RemoveManagementKey, UpdateManagementKey } from 'src/app/core/store/create-did/create-did.actions';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import { ComponentKeyModel } from 'src/app/core/models/component-key.model';
import CustomValidators from 'src/app/core/utils/customValidators';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { DIDService } from 'src/app/core/services/did/did.service';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { RemoveConfirmModalComponent } from 'src/app/components/modals/remove-confirm-modal/remove-confirm-modal.component';
import { SignatureType } from 'src/app/core/enums/signature-type';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

const UP_POSITION = 'up';
const DOWN_POSITION = 'down';

@Component({
  selector: 'app-management-keys',
  templateUrl: './management-keys.component.html',
  styleUrls: ['./management-keys.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ManagementKeysComponent extends BaseComponent implements OnInit, AfterViewInit {
  @ViewChildren(CollapseComponent) collapses: CollapseComponent[];
  private subscription: Subscription;
  private didId: string;
  private managementKeys: ManagementKeyModel[] = [];
  private didKeys: DidKeyModel[] = [];
  public componentKeys: ComponentKeyModel[] = [];
  public keyForm: FormGroup;
  public actionType = ActionType;
  public aliasTooltipMessage = TooltipMessages.AliasTooltip;
  public controllerTooltipMessage = TooltipMessages.ControllerTooltip;
  public signatureTypeTooltipMessage = TooltipMessages.SignatureTypeTooltip;

  constructor(
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private store: Store<AppState>,
    private keysService: KeysService,
    private didService: DIDService,
    private toastr: ToastrService,
    private workflowService: WorkflowService) {
    super();
  }

  ngOnInit() {
    this.subscription = this.store
      .pipe(select(state => state.createDID))
      .subscribe(createDIDState => {
        this.componentKeys = createDIDState.managementKeys.map(key => new ComponentKeyModel(Object.assign({}, key), DOWN_POSITION, true));
        this.managementKeys = createDIDState.managementKeys;
        this.didKeys = createDIDState.didKeys;
      });

    this.subscriptions.push(this.subscription);

    this.didId = this.didService.getId();
    this.createForm();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.collapses.forEach((collapse: CollapseComponent, index) => {
        if (index === this.collapses.length - 1) {
          collapse.toggle();
        }
      });
    });
  }

  createForm() {
    this.keyForm = this.fb.group({
      type: [SignatureType.EdDSA, [Validators.required]],
      controller: [this.didId, [Validators.required]],
      alias: ['', [Validators.required,
      CustomValidators.uniqueKeyAlias(this.componentKeys.map(key => key.keyModel) as ManagementKeyModel[], this.didKeys)]],
      priority: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      priorityRequirement: [null, [Validators.min(0), Validators.max(100)]]
    });

    this.cd.detectChanges();
  }

  generateKey() {
    if (this.keyForm.invalid) {
      return;
    }

    this.keysService.generateKeyPair(this.type.value)
      .subscribe(keyPair => {
        const generatedKey = new ManagementKeyModel(
          this.alias.value,
          this.priority.value,
          this.type.value,
          this.controller.value,
          keyPair.publicKey,
          keyPair.privateKey,
          this.priorityRequirement.value
        );

        this.store.dispatch(new AddManagementKey(generatedKey));
        this.createForm();
      });
  }

  removeKey(key: ManagementKeyModel, event) {
    event.stopPropagation();
    const confirmRef = this.modalService.open(RemoveConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'key';
    confirmRef.result.then((result) => {
      this.store.dispatch(new RemoveManagementKey(key));
      this.createForm();
    }).catch((error) => {
    });
  }

  toggleKey(keyModel) {
    const managementKey = this.componentKeys.find(k => k.keyModel === keyModel);
    managementKey.iconPosition = managementKey.iconPosition === DOWN_POSITION ? UP_POSITION : DOWN_POSITION;
  }

  edit(componentKey: ComponentKeyModel) {
    componentKey.disabled = false;
  }

  confirm(componentKey: ComponentKeyModel) {
    componentKey.disabled = true;
    const updatedKey = componentKey.keyModel as ManagementKeyModel;
    const originalKey = this.managementKeys.find(k => k.publicKey === updatedKey.publicKey);

    if (this.isKeyUpdated(updatedKey, originalKey)) {
      this.store.dispatch(new UpdateManagementKey(updatedKey));
      this.cd.detectChanges();
    }
  }

  goToNext() {
    if (!this.managementKeys.find(mk => mk.priority === 0)) {
      this.toastr.warning('Warning! You must have at least one Management key created at priority 0 before continuing.');
      return;
    }

    this.workflowService.moveToNextStep();
  }

  goToPrevious() {
    this.workflowService.moveToPreviousStep();
  }

  get type() {
    return this.keyForm.get('type');
  }

  get alias() {
    return this.keyForm.get('alias');
  }

  get controller() {
    return this.keyForm.get('controller');
  }

  get priority() {
    return this.keyForm.get('priority');
  }

  get priorityRequirement() {
    return this.keyForm.get('priorityRequirement');
  }

  private isKeyUpdated(updatedKey: ManagementKeyModel, originalKey: ManagementKeyModel) {
    if (updatedKey.alias !== originalKey.alias
      || updatedKey.controller !== originalKey.controller
      || updatedKey.priority !== originalKey.priority
      || updatedKey.priorityRequirement !== originalKey.priorityRequirement) {
      return true;
    }

    return false;
  }
}
