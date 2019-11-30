import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AddManagementKey, UpdateManagementKey } from 'src/app/core/store/update-did/update-did.actions';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import CustomValidators from 'src/app/core/utils/customValidators';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { SignatureType } from 'src/app/core/enums/signature-type';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-management-key-form',
  templateUrl: './management-key-form.component.html',
  styleUrls: ['./management-key-form.component.scss']
})
export class ManagementKeyFormComponent extends BaseComponent implements OnInit {
  private subscription: Subscription;
  public aliasTooltipMessage = TooltipMessages.AliasTooltip;
  public controllerTooltipMessage = TooltipMessages.ControllerTooltip;
  public signatureTypeTooltipMessage = TooltipMessages.SignatureTypeTooltip;
  public CreateMode = 1;
  public UpdateMode = 2;
  public didId: string;
  public keyForm: FormGroup;
  public managementKeys: ManagementKeyModel[];
  public didKeys: DidKeyModel[];
  public keyModel: ManagementKeyModel;
  public mode: number;
  public formScreenOpen: boolean = true;

  constructor(
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
      this.keyModel = this.managementKeys.find(k => k.alias === keyAlias);
      this.mode = this.UpdateMode;
    } else {
      this.keyModel = new ManagementKeyModel('', null, SignatureType.EdDSA, this.didId, '', '', null);
      this.mode = this.CreateMode;
    }

    this.createForm();
  }

  createForm() {
    this.keyForm = this.fb.group({
      type: [this.keyModel.type, [Validators.required]],
      controller: [this.keyModel.controller, [Validators.required]],
      alias: [this.keyModel.alias, [
        Validators.required,
        CustomValidators.uniqueKeyAlias(this.managementKeys, this.didKeys, this.keyModel.alias)
      ]],
      priority: [this.keyModel.priority, [Validators.required, Validators.min(0), Validators.max(100)]],
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

        this.store.dispatch(new AddManagementKey(this.didId, generatedKey));
      });
  }

  private editKey() {
    if (this.isKeyUpdated()) {
      let updatedKeyModel = Object.assign({}, this.keyModel);

      updatedKeyModel.alias = this.alias.value;
      updatedKeyModel.controller = this.controller.value;
      updatedKeyModel.priority = this.priority.value;
      updatedKeyModel.priorityRequirement = this.priorityRequirement.value;

      this.store.dispatch(new UpdateManagementKey(this.didId, updatedKeyModel));
    }
  }

  private isKeyUpdated() {
    if (this.alias.value !== this.keyModel.alias
      || this.controller.value !== this.keyModel.controller
      || this.priority.value !== this.keyModel.priority
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

  get priority() {
    return this.keyForm.get('priority');
  }

  get priorityRequirement() {
    return this.keyForm.get('priorityRequirement');
  }
}
