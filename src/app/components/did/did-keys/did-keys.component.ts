import { CollapseComponent } from 'angular-bootstrap-md';
import { Component, OnInit, AfterViewInit, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, ValidatorFn } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { ActionType } from 'src/app/core/enums/action-type';
import { AddDIDKey, RemoveDIDKey, UpdateDIDKey } from 'src/app/core/store/create-did/create-did.actions';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import { ComponentKeyModel } from 'src/app/core/models/component-key.model';
import CustomValidators from 'src/app/core/utils/customValidators';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { DIDService } from 'src/app/core/services/did/did.service';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { PurposeType } from 'src/app/core/enums/purpose-type';
import { RemoveConfirmModalComponent } from '../../modals/remove-confirm-modal/remove-confirm-modal.component';
import { SignatureType } from 'src/app/core/enums/signature-type';
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
  public actionType = ActionType;
  public availablePurposes = [
    {name: 'Public Key', value: PurposeType.PublicKey},
    {name: 'Authentication Key', value: PurposeType.AuthenticationKey}
  ];
  public keyForm: FormGroup;
  public didKeys: DidKeyModel[] = [];
  public componentKeys: ComponentKeyModel[] = [];
  public managementKeys: ManagementKeyModel[] = [];
  public continueButtonText: string;

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
      .pipe(select(state => state.createDID))
      .subscribe(createDIDState => {
        this.componentKeys = createDIDState.didKeys
          .map(key => new ComponentKeyModel(Object.assign({}, key), DOWN_POSITION, true));

        this.didKeys = createDIDState.didKeys;
        this.managementKeys = createDIDState.managementKeys;
        this.continueButtonText = this.componentKeys.length > 0 ? 'Next' : 'Skip';
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
      purposes: new FormArray([
        new FormControl(false),
        new FormControl(false)
      ], this.validateCheckboxes()),
      controller: [this.didId, [Validators.required]],
      alias: ['', [
        Validators.required,
        CustomValidators.uniqueKeyAlias(
          this.managementKeys,
          this.componentKeys.map(key => key.keyModel) as DidKeyModel[]
        )
      ]],
      priorityRequirement: [null, [Validators.min(0), Validators.max(100)]]
    });

    this.cd.detectChanges();
  }

  generateKey() {
    if (this.keyForm.invalid) {
      return;
    }

    const selectedPurposes = this.keyForm.value.purposes
      .map((selected, i) => selected ? this.availablePurposes[i].value : null)
      .filter(p => p !== null);

    this.keysService.generateKeyPair(this.type.value)
      .subscribe(keyPair => {
        const generatedKey = new DidKeyModel(
          this.alias.value,
          selectedPurposes,
          this.type.value,
          this.controller.value,
          keyPair.publicKey,
          keyPair.privateKey,
          this.priorityRequirement.value
        );

        this.store.dispatch(new AddDIDKey(generatedKey));
        this.createForm();
      });
  }

  removeKey(key: DidKeyModel, event) {
    event.stopPropagation();
    const confirmRef = this.modalService.open(RemoveConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'key';
    confirmRef.result.then((result) => {
      this.store.dispatch(new RemoveDIDKey(key));
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
    const updatedKey = componentKey.keyModel as DidKeyModel;
    const originalKey = this.didKeys.find(k => k.publicKey === updatedKey.publicKey);

    let purposeUpdated = false;
    const updatedKeyPurposes = componentKey.purposes
      .filter(p => p.checked)
      .map(p => p.value);

    if (JSON.stringify(updatedKeyPurposes) !== JSON.stringify(originalKey.purpose)) {
      purposeUpdated = true;
      componentKey.keyModel['purpose'] = updatedKeyPurposes;
    }

    if (this.isKeyUpdated(updatedKey, originalKey) || purposeUpdated) {
      this.store.dispatch(new UpdateDIDKey(updatedKey));
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

  get purposes() {
    return <FormArray>this.keyForm.get('purposes');
  }

  get priorityRequirement() {
    return this.keyForm.get('priorityRequirement');
  }

  private validateCheckboxes() {
    const validator: ValidatorFn = (formArray: FormArray) => {
      const totalSelected = formArray.controls
        .map(control => control.value)
        .reduce((prev, next) => next ? prev + next : prev, 0);

      return totalSelected > 0 ? null : { required: true };
    };

    return validator;
  }

  private isKeyUpdated(updatedKey: DidKeyModel, originalKey: DidKeyModel) {
    if (updatedKey.alias !== originalKey.alias
      || updatedKey.controller !== originalKey.controller
      || updatedKey.priorityRequirement !== originalKey.priorityRequirement) {
      return true;
    }

    return false;
  }
}
