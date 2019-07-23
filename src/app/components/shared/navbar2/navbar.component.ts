import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';

import { actionRoutes } from 'src/app/core/enums/action-routes';
import { ActionType } from 'src/app/core/enums/action-type';
import { AppState } from 'src/app/core/store/app.state';

@Component({
  selector: 'app-navbar2',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public actionType = ActionType;
  public currentStepIndex: number;
  public selectedAction: string;
  public tabLinks: Array<string> = [];

  constructor(private store: Store<AppState>) { }

  ngOnInit(): void {
    this.store
     .pipe(select(state => state.action))
     .subscribe(action => {
        this.currentStepIndex = action.currentStepIndex;
        this.selectedAction = action.selectedAction;

        if (this.selectedAction) {
          const currentRoutes = actionRoutes[this.selectedAction];
          for (let i = 1; i < currentRoutes.length; i++) {
            this.tabLinks[i - 1] = currentRoutes[i].toString();
          }
        }
     });
  }

  getTabsCss() {
    switch (this.selectedAction) {
      case ActionType.CreateBasic:
        return 'basic-mode-tabs';
      case ActionType.Update:
        return 'update-tabs';
      default:
        return null;
    }
  }

  getLinerCss() {
    switch (this.selectedAction) {
      case ActionType.CreateBasic:
        return 'basic-mode-liner';
      case ActionType.Update:
        return 'update-liner';
      default:
        return null;
    }
  }
}
