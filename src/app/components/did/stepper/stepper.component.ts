import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from '../../base.component';
import { ActionType } from 'src/app/core/enums/action-type';

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss']
})
export class StepperComponent extends BaseComponent implements OnInit {
  private subscription: Subscription;
  public currentStepIndex: number;
  public totalNumberOfSteps: number = 3;
  public isVisible: boolean = false;
  
  constructor(private store: Store<AppState>) {
    super();
  }

  ngOnInit() {
    this.subscription = this.store
      .pipe(select(state => state.action))
      .subscribe(action => {
        this.currentStepIndex = action.currentStepIndex;
        if ((action.selectedAction === ActionType.CreateAdvanced || action.selectedAction === ActionType.Update)
          && this.currentStepIndex > 0
          && this.currentStepIndex <= this.totalNumberOfSteps) { 
            this.isVisible = true;
        } else {
          this.isVisible = false;
        }
      });

    this.subscriptions.push(this.subscription);
  }
}
