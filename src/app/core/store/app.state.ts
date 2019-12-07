import { CreateDIDState } from './create-did/create-did.state';
import { UpdateDIDState } from './update-did/update-did.state';
import { WorkflowState } from './workflow/workflow.state';

export interface AppState {
  readonly createDID: CreateDIDState;
  readonly updateDID: UpdateDIDState;
  readonly workflow: WorkflowState;
}
