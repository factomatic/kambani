import { ActionReducerMap } from '@ngrx/store';

import { AppState } from './app.state';
import { createDIDReducers } from './create-did/create-did.reducers';
import { updateDIDReducers } from './update-did/update-did.reducers';
import { workflowReducers } from './workflow/workflow.reducers';

export const appReducers: ActionReducerMap<AppState> = {
  createDID: createDIDReducers,
  updateDID: updateDIDReducers,
  workflow: workflowReducers
};
