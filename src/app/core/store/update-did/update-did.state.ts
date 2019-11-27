import { UpdateDIDModel } from '../../models/update-did.model';

export interface UpdateDIDState {
  readonly dids: UpdateDIDModel[];
  readonly didsWithPendingChanges: string[];
}