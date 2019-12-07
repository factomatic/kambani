export interface WorkflowState {
  readonly selectedAction: string;
  readonly currentStepIndex: number;
  readonly closeFormScreen: boolean;
}
