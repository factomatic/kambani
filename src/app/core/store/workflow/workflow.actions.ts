import { Action } from '@ngrx/store';

export enum WorkflowActionTypes {
  CLEAR_WORKFLOW_STATE = '[Workflow] Clear Workflow State',
  MOVE_TO_STEP = '[Workflow] Move To Step',
  SELECT_ACTION = '[Workflow] Select Action'
}

export class SelectAction implements Action {
  readonly type: string = WorkflowActionTypes.SELECT_ACTION;

  constructor (public payload: string) { }
}

export class MoveToStep implements Action {
  readonly type: string = WorkflowActionTypes.MOVE_TO_STEP;

  constructor (public payload: number) { }
}

export class ClearWorkflowState implements Action {
  readonly type: string = WorkflowActionTypes.CLEAR_WORKFLOW_STATE;
}
