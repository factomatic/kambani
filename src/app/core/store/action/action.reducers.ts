import { ActionState } from './action.state';
import { CLEAR_FORM, MOVE_TO_STEP, SELECT_ACTION } from './action.actions';

const initialState = {
  selectedAction: undefined,
  currentStepIndex: 0
};

export function actionReducers(state: ActionState = initialState, action) {
  switch (action.type) {
    case CLEAR_FORM:
      return initialState;
    case MOVE_TO_STEP:
      return Object.assign({}, state, {
        currentStepIndex: action.payload
      });
    case SELECT_ACTION:
      return Object.assign({}, state, {
        selectedAction: action.payload
      });
    default:
      return state;
  }
}
