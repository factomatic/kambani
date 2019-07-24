import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ActionType } from '../enums/action-type';
import { SharedRoutes } from '../enums/shared-routes';
import { WorkflowService } from '../services/workflow/workflow.service';

@Injectable({
 providedIn: 'root'
})
export class CreateActionGuard implements CanActivate {
  constructor(
    private router: Router,
    private workflowService: WorkflowService) { }

  canActivate(
     next: ActivatedRouteSnapshot,
     state: RouterStateSnapshot ): Observable<boolean> | Promise<boolean> | boolean {

    const selectedAction = this.workflowService.getSelectedAction();
    if (selectedAction === ActionType.CreateAdvanced || selectedAction === ActionType.CreateBasic) {
      return true;
    }

    this.router.navigate([SharedRoutes.ManageDids]);
    return false;
  }
}
