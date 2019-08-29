import { DidKeyEntryModel } from './did-key-entry';
import { ManagementKeyEntryModel } from './management-key-entry';
import { ServiceEntryModel } from './service-entry';
import { RevokeModel } from './revoke-model';

export interface UpdateEntryDocument {
  revoke?: {
    managementKey?: RevokeModel[],
    didKey?: RevokeModel[],
    service?: RevokeModel[]
  },
  add?: { 
    managementKey?: ManagementKeyEntryModel[],
    didKey?: DidKeyEntryModel[],
    service?: ServiceEntryModel[]
  }
}