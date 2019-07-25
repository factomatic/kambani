import { ActionState } from './action/action.state';
import { FormState } from './form/form.state';

export interface AppState {
  readonly action: ActionState;
  readonly form: FormState;
}
