import { DidKeyEntryModel } from './did-key-entry';
import { ManagementKeyEntryModel } from './management-key-entry';
import { ServiceEntryModel } from './service-entry';

export interface UpdateEntryDocument {
  revoke?: {
    managementKey?: [],
    didKey?: [],
    service?: []
  },
  add?: { 
    managementKey?: ManagementKeyEntryModel[],
    didKey?: DidKeyEntryModel[],
    service?: ServiceEntryModel[]
  }
}