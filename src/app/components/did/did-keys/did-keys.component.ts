import { CollapseComponent } from 'angular-bootstrap-md';
import { Component, OnInit, AfterViewInit, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { ActionType } from 'src/app/core/enums/action-type';
import { AddDidKey, RemoveDidKey, UpdateDidKey } from 'src/app/core/store/form/form.actions';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import { ComponentKeyModel } from 'src/app/core/models/component-key.model';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import CustomValidators from 'src/app/core/utils/customValidators';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { DIDService } from 'src/app/core/services/did/did.service';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { PurposeType } from 'src/app/core/enums/purpose-type';
import { SignatureType } from 'src/app/core/enums/signature-type';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

const UP_POSITION = 'up';
const DOWN_POSITION = 'down';

@Component({
  selector: 'app-did-keys',
  templateUrl: './did-keys.component.html',
  styleUrls: ['./did-keys.component.scss']
})
export class DidKeysComponent extends BaseComponent implements OnInit, AfterViewInit {
  @ViewChildren(CollapseComponent) collapses: CollapseComponent[];
  private subscription: Subscription;
  private didId: string;
  public keyForm: FormGroup;
  public actionType = ActionType;
  public didKeys: DidKeyModel[] = [];
  public componentKeys: ComponentKeyModel[] = [];
  public managementKeys: ManagementKeyModel[] = [];
  public actionDropdownTooltipMessage = TooltipMessages.AuthenticationDropdownTooltip;
  public continueButtonText: string;
  public selectedAction: string;

  constructor(
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private store: Store<AppState>,
    private keysService: KeysService,
    private didService: DIDService,
    private workflowService: WorkflowService) {
    super();
  }

  ngOnInit() {
    this.subscription = this.store
      .pipe(select(state => state))
      .subscribe(state => {
        this.componentKeys = state.form.didKeys
          .map(key => new ComponentKeyModel(Object.assign({}, key), DOWN_POSITION, true));

        this.didKeys = state.form.didKeys;
        this.managementKeys = state.form.managementKeys;
        this.continueButtonText = this.componentKeys.length > 0 ? 'Next' : 'Skip';
        this.selectedAction = state.action.selectedAction;
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
      purpose: [PurposeType.PublicKey, [Validators.required]],
      controller: [this.didId, [Validators.required]],
      alias: ['', [
        Validators.required,
        CustomValidators.uniqueKeyAlias(
          this.managementKeys,
          this.componentKeys.map(key => key.keyModel) as DidKeyModel[]
        )
      ]]
    });

    this.cd.detectChanges();
  }

  generateKey() {
    if (this.keyForm.invalid) {
      return;
    }

    this.keysService.generateKeyPair(this.type.value)
      .subscribe(keyPair => {
        const generatedKey = new DidKeyModel(
          this.alias.value,
          [this.purpose.value],
          this.type.value,
          this.controller.value,
          keyPair.publicKey,
          keyPair.privateKey
        );

        this.store.dispatch(new AddDidKey(generatedKey));
        this.createForm();
      });
  }

  removeKey(key: DidKeyModel) {
    const confirmRef = this.modalService.open(ConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'key';
    confirmRef.result.then((result) => {
      this.store.dispatch(new RemoveDidKey(key));
      this.createForm();
    }).catch((error) => {
    });
  }

  toggleKey(keyModel) {
    const didKey = this.componentKeys.find(k => k.keyModel === keyModel);
    didKey.iconPosition = didKey.iconPosition === DOWN_POSITION ? UP_POSITION : DOWN_POSITION;
  }

  edit(componentKey: ComponentKeyModel) {
    componentKey.disabled = false;
  }

  confirm(componentKey: ComponentKeyModel) {
    componentKey.disabled = true;
    const updatedKey = componentKey.keyModel;
    const originalKey = this.didKeys.find(k => k.publicKey === updatedKey.publicKey);

    if (updatedKey.alias !== originalKey.alias || updatedKey.controller !== originalKey.controller) {
      this.store.dispatch(new UpdateDidKey(componentKey.keyModel as DidKeyModel));
      this.cd.detectChanges();
    }
  }

  goToNext() {
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

  get purpose() {
    return this.keyForm.get('purpose');
  }
}
