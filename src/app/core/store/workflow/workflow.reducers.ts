import { WorkflowState } from './workflow.state';
import { WorkflowActionTypes } from './workflow.actions';

const initialState = {
  selectedAction: undefined,
  currentStepIndex: 0
};

export function workflowReducers(state: WorkflowState = initialState, action) {
  switch (action.type) {
    case WorkflowActionTypes.CLEAR_WORKFLOW_STATE:
      return initialState;
    case WorkflowActionTypes.MOVE_TO_STEP:
      return Object.assign({}, state, {
        currentStepIndex: action.payload
      });
    case WorkflowActionTypes.SELECT_ACTION:
      return Object.assign({}, state, {
        selectedAction: action.payload,
        currentStepIndex: 0
      });
    default:
      return state;
  }
}
