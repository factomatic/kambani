import { CollapseComponent } from 'angular-bootstrap-md';
import { Component, OnInit, AfterViewInit, ViewChildren, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { ActionType } from 'src/app/core/enums/action-type';
import { AddAuthenticationKey, RemoveAuthenticationKey, UpdateAuthenticationKey } from 'src/app/core/store/form/form.actions';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import { ComponentKeyModel } from 'src/app/core/models/component-key.model';
import { ConfirmModalComponent } from '../../modals/confirm-modal/confirm-modal.component';
import CustomValidators from 'src/app/core/utils/customValidators';
import { DIDService } from 'src/app/core/services/did/did.service';
import { KeyModel } from 'src/app/core/models/key.model';
import { GenerateKeysService } from 'src/app/core/services/keys/generate.keys.service';
import { SignatureType } from 'src/app/core/enums/signature-type';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

const GENERATE_ACTION = 'generate';
const UP_POSITION = 'up';
const DOWN_POSITION = 'down';

@Component({
  selector: 'app-authentication-keys',
  templateUrl: './authentication-keys.component.html',
  styleUrls: ['./authentication-keys.component.scss']
})
export class AuthenticationKeysComponent extends BaseComponent implements OnInit, AfterViewInit {
  @ViewChildren(CollapseComponent) collapses: CollapseComponent[];
  private subscription$: Subscription;
  private didId: string;
  public keyForm: FormGroup;
  public actionType = ActionType;
  public componentAction = GENERATE_ACTION;
  public selectedKey: KeyModel;
  public authenticationKeys: KeyModel[] = [];
  public componentKeys: ComponentKeyModel[] = [];
  public availablePublicKeys: ComponentKeyModel[] = [];
  public actionDropdownTooltipMessage = TooltipMessages.AuthenticationDropdownTooltip;
  public continueButtonText: string;
  public selectedAction: string;

  constructor(
    private cd: ChangeDetectorRef,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private zone: NgZone,
    private store: Store<AppState>,
    private keysService: GenerateKeysService,
    private didService: DIDService,
    private workflowService: WorkflowService) {
    super();
  }

  ngOnInit() {
    this.subscription$ = this.store
      .pipe(select(state => state))
      .subscribe(state => {
        this.componentKeys = state.form.authenticationKeys
          .map(key => new ComponentKeyModel(Object.assign({}, key), DOWN_POSITION, true));

        this.availablePublicKeys = state.form.publicKeys
          .filter(k => !state.form.authenticationKeys.includes(k))
          .map(key => new ComponentKeyModel(key, DOWN_POSITION, true));

        this.authenticationKeys = state.form.authenticationKeys;
        this.continueButtonText = this.componentKeys.length > 0 ? 'Next' : 'Skip';
        this.selectedAction = state.action.selectedAction;
      });

    this.subscriptions.push(this.subscription$);

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
      alias: ['', [
        Validators.required,
        CustomValidators.uniqueKeyAlias(
          this.availablePublicKeys.map(key => key.keyModel),
          this.componentKeys.map(key => key.keyModel)
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
        const generatedKey = new KeyModel(
          this.alias.value,
          this.type.value,
          this.controller.value,
          keyPair.publicKey,
          keyPair.privateKey
        );

        this.store.dispatch(new AddAuthenticationKey(generatedKey));
        this.createForm();
      });
  }

  changeAction(event) {
    this.componentAction = event.target.value;
    if (this.componentAction !== GENERATE_ACTION) {
      this.selectedKey = this.availablePublicKeys.find(k => k.keyModel.publicKey === this.componentAction).keyModel;
    } else {
      this.selectedKey = undefined;
    }

    setTimeout(() => {
      this.collapses.forEach((collapse: CollapseComponent, index) => {
        if (index === this.collapses.length - 1) {
          this.zone.run(() => {
            collapse.toggle();
          });
        }
      });
    });
  }

  addSelectedKey() {
    this.store.dispatch(new AddAuthenticationKey(this.selectedKey));
    this.selectedKey = undefined;
    this.componentAction = GENERATE_ACTION;

    setTimeout(() => {
      this.collapses.forEach((collapse: CollapseComponent, index) => {
        if (index === this.collapses.length - 1) {
          this.zone.run(() => {
            collapse.toggle();
          });
        }
      });
    });

    this.cd.detectChanges();
  }

  removeKey(key: KeyModel) {
    const confirmRef = this.modalService.open(ConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'key';
    confirmRef.result.then((result) => {
      this.store.dispatch(new RemoveAuthenticationKey(key));
      this.createForm();
    }).catch((error) => {
    });
  }

  toggleKey(keyModel) {
    const publicKey = this.componentKeys.find(k => k.keyModel === keyModel);
    publicKey.iconPosition = publicKey.iconPosition === DOWN_POSITION ? UP_POSITION : DOWN_POSITION;
  }

  edit(componentKey: ComponentKeyModel) {
    componentKey.disabled = false;
  }

  confirm(componentKey: ComponentKeyModel) {
    componentKey.disabled = true;
    const updatedKey = componentKey.keyModel;
    const originalKey = this.authenticationKeys.find(k => k.publicKey === updatedKey.publicKey);

    if (updatedKey.alias !== originalKey.alias || updatedKey.controller !== originalKey.controller) {
      this.store.dispatch(new UpdateAuthenticationKey(componentKey.keyModel));
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
}
