import { ActionReducerMap } from '@ngrx/store';

import { actionReducers } from './action/action.reducers';
import { AppState } from './app.state';
import { formReducers } from './form/form.reducers';

export const appReducers: ActionReducerMap<AppState> = {
  action: actionReducers,
  form: formReducers
};
