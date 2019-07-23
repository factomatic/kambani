import { actionReducers } from './action/action.reducers';
import { formReducers } from './form/form.reducers';

export const appReducers = {
  action: actionReducers,
  form: formReducers
};
