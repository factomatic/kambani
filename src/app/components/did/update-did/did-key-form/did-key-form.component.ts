import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, ValidatorFn } from '@angular/forms';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AddDIDKey, UpdateDIDKey } from 'src/app/core/store/update-did/update-did.actions';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import CustomValidators from 'src/app/core/utils/customValidators';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { PurposeType } from 'src/app/core/enums/purpose-type';
import { SignatureType } from 'src/app/core/enums/signature-type';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-did-key-form',
  templateUrl: './did-key-form.component.html',
  styleUrls: ['./did-key-form.component.scss']
})
export class DidKeyFormComponent extends BaseComponent implements OnInit {
  private subscription: Subscription;
  private purposesFormArray: FormArray;
  public aliasTooltipMessage = TooltipMessages.AliasTooltip;
  public controllerTooltipMessage = TooltipMessages.ControllerTooltip;
  public signatureTypeTooltipMessage = TooltipMessages.SignatureTypeTooltip;
  public availablePurposes = [
    {name: 'Public Key', value: PurposeType.PublicKey},
    {name: 'Authentication Key', value: PurposeType.AuthenticationKey}
  ];
  public CreateMode = 1;
  public UpdateMode = 2;
  public didId: string;
  public keyForm: FormGroup;
  public managementKeys: ManagementKeyModel[];
  public didKeys: DidKeyModel[];
  public keyModel: DidKeyModel;
  public mode: number;
  public formScreenOpen: boolean = true;

  constructor (
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<AppState>,
    private keysService: KeysService,
    private workflowService: WorkflowService) {
    super();
  }

  ngOnInit() {
    this.didId = this.route.parent.snapshot.params.id;

    this.subscription = this.store
      .pipe(select(state => state.updateDID))
      .subscribe(updateDIDState => {
        const didUpdateModel = updateDIDState.dids.find(d => d.didId == this.didId);
        this.managementKeys = didUpdateModel.managementKeys;
        this.didKeys = didUpdateModel.didKeys;
      });
    
    this.subscriptions.push(this.subscription);

    if (this.route.snapshot.params.id) {
      const keyAlias = this.route.snapshot.params.id;
      this.keyModel = this.didKeys.find(k => k.alias === keyAlias);
      this.mode = this.UpdateMode;
      this.purposesFormArray = new FormArray([
        new FormControl(this.keyModel.purpose.includes(PurposeType.PublicKey)),
        new FormControl(this.keyModel.purpose.includes(PurposeType.AuthenticationKey))
      ], this.validateCheckboxes());

    } else {
      this.keyModel = new DidKeyModel('', [], SignatureType.EdDSA, this.didId, '', '', null);
      this.mode = this.CreateMode;
      this.purposesFormArray = new FormArray([new FormControl(false), new FormControl(false)], this.validateCheckboxes());
    }

    this.createForm();
  }

  createForm() {
    this.keyForm = this.fb.group({
      type: [this.keyModel.type, [Validators.required]],
      purposes: this.purposesFormArray,
      controller: [this.keyModel.controller, [Validators.required]],
      alias: [this.keyModel.alias, [
        Validators.required,
        CustomValidators.uniqueKeyAlias(this.managementKeys, this.didKeys, this.keyModel.alias)
      ]],
      priorityRequirement: [this.keyModel.priorityRequirement, [Validators.min(0), Validators.max(100)]]
    });

    if (this.mode == this.UpdateMode) {
      this.keyForm.get('type').disable();
    }
  }

  saveForm() {
    if (this.keyForm.invalid) {
      return;
    }

    this.mode == this.CreateMode
      ? this.generateKey()
      : this.editKey();

    this.router.navigate([`dids/preview/${this.didId}`]);
    this.workflowService.closeUpdateForm();
  }

  private generateKey() {
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

        this.store.dispatch(new AddDIDKey(this.didId, generatedKey));
      });
  }

  private editKey(){
    if (this.isKeyUpdated()) {
      let updatedKeyModel = Object.assign({}, this.keyModel);

      const selectedPurposes = this.keyForm.value.purposes
      .map((selected, i) => selected ? this.availablePurposes[i].value : null)
      .filter(p => p !== null);

      updatedKeyModel.alias = this.alias.value;
      updatedKeyModel.purpose = selectedPurposes;
      updatedKeyModel.controller = this.controller.value;
      updatedKeyModel.priorityRequirement = this.priorityRequirement.value;

      this.store.dispatch(new UpdateDIDKey(this.didId, updatedKeyModel));
    }
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

  private isKeyUpdated() {
    if (this.alias.value !== this.keyModel.alias
      || this.purposes.value !== this.keyModel.purpose[0]
      || this.controller.value !== this.keyModel.controller
      || this.priorityRequirement.value !== this.keyModel.priorityRequirement) {
      return true;
    }

    return false;
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
}
