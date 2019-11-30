import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AddService } from 'src/app/core/store/update-did/update-did.actions';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import CustomValidators from 'src/app/core/utils/customValidators';
import { ServiceModel } from 'src/app/core/models/service.model';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-service-form',
  templateUrl: './service-form.component.html',
  styleUrls: ['./service-form.component.scss']
})
export class ServiceFormComponent extends BaseComponent implements OnInit {
  private subscription: Subscription;
  public aliasTooltipMessage = TooltipMessages.AliasTooltip;
  public controllerTooltipMessage = TooltipMessages.ControllerTooltip;
  public signatureTypeTooltipMessage = TooltipMessages.SignatureTypeTooltip;
  public headerTooltipMessage = TooltipMessages.ServicesHeaderTooltip;
  public headerBoldPartTooltipMessage = TooltipMessages.ServicesHeaderBoldPartTooltip;
  public typeTooltipMessage = TooltipMessages.ServiceTypeTooltip;
  public endpointTooltipMessage = TooltipMessages.ServiceEndpointTooltip;
  public didId: string;
  public formScreenOpen: boolean = true;
  public serviceForm: FormGroup;
  public services: ServiceModel[];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<AppState>,
    private workflowService: WorkflowService ) {
      super();
    }

  ngOnInit() {
    this.didId = this.route.parent.snapshot.params.id;

    this.subscription = this.store
      .pipe(select(state => state.updateDID))
      .subscribe(updateDIDState => {
        const didUpdateModel = updateDIDState.dids.find(d => d.didId === this.didId);
        this.services = didUpdateModel.services;
      });
    
    this.subscriptions.push(this.subscription);
    this.createForm();
  }

  createForm() {
    this.serviceForm = this.fb.group({
      type: ['', [Validators.required]],
      endpoint: ['', [Validators.required]],
      alias: ['', [
        Validators.required,
        CustomValidators.uniqueServiceAlias(this.services)
      ]],
      priorityRequirement: [null, [Validators.min(0), Validators.max(100)]]
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

    this.store.dispatch(new AddService(this.didId, service));

    this.router.navigate([`dids/preview/${this.didId}`]);
    this.workflowService.closeUpdateForm();
  }

  get type() {
    return this.serviceForm.get('type');
  }

  get alias() {
    return this.serviceForm.get('alias');
  }

  get endpoint() {
    return this.serviceForm.get('endpoint');
  }

  get priorityRequirement() {
    return this.serviceForm.get('priorityRequirement');
  }
}
