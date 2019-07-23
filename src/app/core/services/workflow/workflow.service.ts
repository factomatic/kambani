import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';

import { actionRoutes } from '../../enums/action-routes';
import { AppState } from '../../store/app.state';
import { MoveToStep } from '../../store/action/action.actions';

@Injectable()
export class WorkflowService {
  private selectedAction: string;
  private currentStepIndex: number;
  private selectedActionRoutes;

  constructor (
    private router: Router,
    private store: Store<AppState>) {
    this.store.pipe(select(state => state.action))
      .subscribe(action => {
        this.selectedAction = action.selectedAction;
        this.currentStepIndex = action.currentStepIndex;

        if (this.selectedAction) {
          this.selectedActionRoutes = actionRoutes[this.selectedAction];
        }
      });
  }

  getSelectedAction(): string {
    return this.selectedAction;
  }

  getCurrentStepIndex(): number {
    return this.currentStepIndex;
  }

  moveToNextStep(queryParams?: any) {
    const nextStepIndex = this.currentStepIndex + 1;
    this.store.dispatch(new MoveToStep(nextStepIndex));
    this.router.navigate([this.selectedActionRoutes[nextStepIndex]], queryParams);
  }

  moveToPreviousStep() {
    const previousStepIndex = this.currentStepIndex - 1;
    this.store.dispatch(new MoveToStep(previousStepIndex));
    this.router.navigate([this.selectedActionRoutes[previousStepIndex]]);
  }
}
