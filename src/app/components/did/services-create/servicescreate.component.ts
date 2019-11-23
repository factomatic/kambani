import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { SignatureType } from 'src/app/core/enums/signature-type';
import CustomValidators from 'src/app/core/utils/customValidators';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { DIDDocument } from 'src/app/core/interfaces/did-document';
import { Store, select } from '@ngrx/store';
import { AppState } from 'src/app/core/store/app.state';
import { Subscription } from 'rxjs';

import { AddService, RemoveService } from 'src/app/core/store/form/form.actions';
import { ComponentServiceModel } from 'src/app/core/models/component-service.model';
import { ServiceModel } from 'src/app/core/models/service.model';



const UP_POSITION = 'up';
const DOWN_POSITION = 'down';

@Component({
  selector: 'app-services-create',
  templateUrl: './servicescreate.component.html',
  styleUrls: ['./servicescreate.component.scss']
})
export class ServiceCreateComponent implements OnInit {
  private subscription: Subscription;
  public didId: string;
  public aliasTooltipMessage = TooltipMessages.AliasTooltip;
  public controllerTooltipMessage = TooltipMessages.ControllerTooltip;
  public signatureTypeTooltipMessage = TooltipMessages.SignatureTypeTooltip;
  public services: ComponentServiceModel[] = [];
  public serviceForm: FormGroup;
  public headerTooltipMessage = TooltipMessages.ServicesHeaderTooltip;
  public headerBoldPartTooltipMessage = TooltipMessages.ServicesHeaderBoldPartTooltip;
  public typeTooltipMessage = TooltipMessages.ServiceTypeTooltip;
  public endpointTooltipMessage = TooltipMessages.ServiceEndpointTooltip;
  public formScreenOpen: boolean = true;
  public editServiceId: string;
  public currentServiceUpdate;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private vaultService: VaultService,
    private store: Store<AppState>
   ) { }

  ngOnInit() {

    this.didId = this.route.parent.snapshot.params.id;

    this.subscription = this.store
      .pipe(select(state => state))
      .subscribe(state => {
        this.services = state.form.services.map(service => new ComponentServiceModel(service, DOWN_POSITION));
        // this.continueButtonText = this.services.length > 0 ? 'Next' : 'Skip';
        // this.selectedAction = state.action.selectedAction;
      });


    if(typeof this.route.snapshot.params.id !== 'undefined'){

        this.editServiceId = this.route.snapshot.params.id;
        this.currentServiceUpdate = this.services.find(k => k.serviceModel.alias === this.editServiceId);
        // console.log(this.currentServiceUpdate);
        if(typeof this.currentServiceUpdate === 'undefined'){
          // SHOULD BE REDIRECTED TO DID PREVIEW?
        }else {
          this.currentServiceUpdate = this.currentServiceUpdate.serviceModel;
        }

    }else {
      this.currentServiceUpdate = {type: "", endpoint: "", alias: "", priorityRequirement: ''};
    //   // console.log(this.editKeyId);
    }

    this.createForm();
  }

  createForm() {
    this.serviceForm = this.fb.group({
      type: [this.currentServiceUpdate.type, [Validators.required]],
      endpoint: [this.currentServiceUpdate.endpoint, [Validators.required]],
      alias: [this.currentServiceUpdate.alias, [Validators.required, CustomValidators.uniqueServiceAlias(this.services.map(s => s.serviceModel))]],
      priorityRequirement: [this.currentServiceUpdate.priorityRequirement, [Validators.min(0), Validators.max(100)]]
    });
  }

  addService() {
    if (this.serviceForm.invalid) {
      return;
    }

    const service = new ServiceModel(
      this.type.value,
      this.endpoint.value,
      this.alias.value,
      this.priorityRequirement.value
    );

    // this.store.dispatch(new AddService(service));
    // this.createForm();
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

  get type () {
    return this.serviceForm.get('type');
  }

  get alias () {
    return this.serviceForm.get('alias');
  }

  get endpoint () {
    return this.serviceForm.get('endpoint');
  }

  get priorityRequirement() {
    return this.serviceForm.get('priorityRequirement');
  }
}
