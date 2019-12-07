import { CollapseComponent } from 'angular-bootstrap-md';
import { Component, OnInit, AfterViewInit, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Store, select } from '@ngrx/store';

import { ActionType } from 'src/app/core/enums/action-type';
import { AddService, RemoveService } from 'src/app/core/store/create-did/create-did.actions';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import { ComponentServiceModel } from 'src/app/core/models/component-service.model';
import CustomValidators from 'src/app/core/utils/customValidators';
import { RemoveConfirmModalComponent } from '../../modals/remove-confirm-modal/remove-confirm-modal.component';
import { ServiceModel } from 'src/app/core/models/service.model';
import { Subscription } from 'rxjs';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

const UP_POSITION = 'up';
const DOWN_POSITION = 'down';

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss']
})
export class ServicesComponent extends BaseComponent implements OnInit, AfterViewInit {
  @ViewChildren(CollapseComponent) collapses: CollapseComponent[];
  private subscription: Subscription;
  public services: ComponentServiceModel[] = [];
  public serviceForm: FormGroup;
  public actionType = ActionType;
  public headerTooltipMessage = TooltipMessages.ServicesHeaderTooltip;
  public headerBoldPartTooltipMessage = TooltipMessages.ServicesHeaderBoldPartTooltip;
  public typeTooltipMessage = TooltipMessages.ServiceTypeTooltip;
  public endpointTooltipMessage = TooltipMessages.ServiceEndpointTooltip;
  public continueButtonText: string;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private store: Store<AppState>,
    private workflowService: WorkflowService) {
    super();
  }

  ngOnInit() {
    this.subscription = this.store
      .pipe(select(state => state))
      .subscribe(state => {
        this.services = state.createDID.services.map(service => new ComponentServiceModel(service, DOWN_POSITION));
        this.continueButtonText = this.services.length > 0 ? 'Next' : 'Skip';
      });

    this.subscriptions.push(this.subscription);
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
    this.serviceForm = this.fb.group({
      type: ['', [Validators.required]],
      endpoint: ['', [Validators.required]],
      alias: ['', [Validators.required, CustomValidators.uniqueServiceAlias(this.services.map(s => s.serviceModel))]],
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

    this.store.dispatch(new AddService(service));
    this.createForm();
  }

  removeService(service: ServiceModel, event) {
    event.stopPropagation();
    const confirmRef = this.modalService.open(RemoveConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'service';
    confirmRef.result.then((result) => {
      this.store.dispatch(new RemoveService(service));
      this.createForm();
    }).catch((error) => {
    });
  }

  toggleService(serviceModel) {
    const service = this.services.find(s => s.serviceModel === serviceModel);
    service.iconPosition = service.iconPosition === DOWN_POSITION ? UP_POSITION : DOWN_POSITION;
  }

  goToNext() {
    this.workflowService.moveToNextStep();
  }

  goToPrevious() {
    this.workflowService.moveToPreviousStep();
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
