import { Action } from '@ngrx/store';

export const CLEAR_FORM = '[ACTION] CLEAR_FORM';
export const MOVE_TO_STEP = '[ACTION] MOVE_TO_STEP';
export const SELECT_ACTION = '[ACTION] SELECT_ACTION';

export class SelectAction implements Action {
  readonly type: string = SELECT_ACTION;

  constructor (public payload: string) { }
}

export class MoveToStep implements Action {
  readonly type: string = MOVE_TO_STEP;

  constructor (public payload: number) { }
}

export class ClearForm implements Action {
  readonly type: string = CLEAR_FORM;
}
