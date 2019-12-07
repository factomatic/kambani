import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

import { ActionType } from 'src/app/core/enums/action-type';
import { AppState } from 'src/app/core/store/app.state';
import { ClearCreateDIDState } from 'src/app/core/store/create-did/create-did.actions';
import { ClearWorkflowState, SelectAction } from 'src/app/core/store/workflow/workflow.actions';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-action',
  templateUrl: './action.component.html',
  styleUrls: ['./action.component.scss']
})
export class ActionComponent implements OnInit {
  public actionType = ActionType.CreateBasic;
  public infoModals = { };

  constructor(
    private keysService: KeysService,
    private store: Store<AppState>,
    private workflowService: WorkflowService) { }

  ngOnInit() {
    this.store.dispatch(new ClearWorkflowState());
    this.store.dispatch(new ClearCreateDIDState());
  }

  goToNext() {
    this.store.dispatch(new SelectAction(this.actionType));

    if (this.actionType === ActionType.CreateBasic) {
      this.keysService.autoGenerateKeys();
    }

    this.workflowService.moveToNextStep();
  }
}
