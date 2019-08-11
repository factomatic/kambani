import { DidKeyEntryModel } from './did-key-entry';
import { ManagementKeyEntryModel } from './management-key-entry';
import { ServiceEntryModel } from './service-entry';

export interface DIDDocument {
  didMethodVersion: string;
  managementKey: ManagementKeyEntryModel[];
  didKey?: DidKeyEntryModel[];
  service?: ServiceEntryModel[];
}
