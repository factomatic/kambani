import { Action } from '@ngrx/store';

export enum WorkflowActionTypes {
  CLEAR_WORKFLOW_STATE = '[Workflow] Clear Workflow State',
  MOVE_TO_STEP = '[Workflow] Move To Step',
  SELECT_ACTION = '[Workflow] Select Action',
  CLOSE_FORM_SCREEN = '[Workflow] Close Form Screen'
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

export class CloseFormScreen implements Action {
  readonly type: string = WorkflowActionTypes.CLOSE_FORM_SCREEN;
}
