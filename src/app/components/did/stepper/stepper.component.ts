import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { ActionType } from 'src/app/core/enums/action-type';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from '../../base.component';

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
      .pipe(select(state => state.workflow))
      .subscribe(workflow => {
        this.currentStepIndex = workflow.currentStepIndex;
        if (workflow.selectedAction === ActionType.CreateAdvanced
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
