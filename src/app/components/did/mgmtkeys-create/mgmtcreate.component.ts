import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { SignatureType } from 'src/app/core/enums/signature-type';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import CustomValidators from 'src/app/core/utils/customValidators';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { DIDDocument } from 'src/app/core/interfaces/did-document';
import { ComponentKeyModel } from 'src/app/core/models/component-key.model';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { Store, select } from '@ngrx/store';
import { AppState } from 'src/app/core/store/app.state';
import { AddManagementKey, UpdateManagementKey } from 'src/app/core/store/form/form.actions';
import { Subscription } from 'rxjs';

const UP_POSITION = 'up';
const DOWN_POSITION = 'down';

@Component({
  selector: 'app-mgmtkey-create',
  templateUrl: './mgmtcreate.component.html',
  styleUrls: ['./mgmtcreate.component.scss']
})
export class ManagementKeyCreateComponent implements OnInit {
  private subscription: Subscription;
  public didId: string;
  public aliasTooltipMessage = TooltipMessages.AliasTooltip;
  public controllerTooltipMessage = TooltipMessages.ControllerTooltip;
  public signatureTypeTooltipMessage = TooltipMessages.SignatureTypeTooltip;
  public keyForm: FormGroup;
  public managementKeys: ManagementKeyModel[];
  public didKeys: DidKeyModel[];
  public componentKeys: ComponentKeyModel[] = [];
  public currentKeyUpdate;
  public editKeyId;
  public formScreenOpen: boolean = true;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private vaultService: VaultService,
    private store: Store<AppState>,
    private keysService: KeysService
   ) { }

  ngOnInit() {

    this.didId = this.route.parent.snapshot.params.id;

    this.subscription = this.store
      .pipe(select(state => state))
      .subscribe(state => {
        this.componentKeys = state.form.managementKeys.map(key => new ComponentKeyModel(Object.assign({}, key), DOWN_POSITION, true));
        this.managementKeys = state.form.managementKeys;
        this.didKeys = state.form.didKeys;
      });

    // this.subscriptions.push(this.subscription);

    if(typeof this.route.snapshot.params.id !== 'undefined'){

        this.editKeyId = this.route.snapshot.params.id;

        this.currentKeyUpdate = this.managementKeys.find(k => k.alias === this.editKeyId);
        if(typeof this.currentKeyUpdate === 'undefined'){
          // SHOULD BE REDIRECTED TO DID PREVIEW?
        }

    }else {
      this.currentKeyUpdate = {type: SignatureType.EdDSA, didId: this.didId, alias: '', priority: '', priorityRequirement: ''};
      // console.log(this.editKeyId);
    }

    this.createForm();
  }

  createForm() {
    this.keyForm = this.fb.group({
      type: [this.currentKeyUpdate.type.split('VerificationKey')[0], [Validators.required]],
      controller: [this.didId, [Validators.required]],
      alias: [this.currentKeyUpdate.alias, [Validators.required,
      CustomValidators.uniqueKeyAlias(this.componentKeys.map(key => key.keyModel) as ManagementKeyModel[], this.didKeys)]],
      priority: [this.currentKeyUpdate.priority, [Validators.required, Validators.min(0), Validators.max(100)]],
      priorityRequirement: [this.currentKeyUpdate.priorityRequirement, [Validators.min(0), Validators.max(100)]]
    });

    // this.cd.detectChanges();
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

  edit(){

    // const updatedKey = componentKey.keyModel;
    // const originalKey = this.managementKeys.find(k => k.publicKey === updatedKey.publicKey);
    //
    // console.log(originalKey);
    //
    // if (updatedKey.alias !== originalKey.alias || updatedKey.controller !== originalKey.controller) {
    //   this.store.dispatch(new UpdateManagementKey(componentKey.keyModel as ManagementKeyModel));
    //   this.cd.detectChanges();
    // }

  }

  closeFormScreen() {
    this.formScreenOpen = false;
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
