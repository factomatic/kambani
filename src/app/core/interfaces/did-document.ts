export interface DIDDocument {
  didMethodVersion: string;
  managementKey: any[];
  didKey?: any[];
  service?: any[];
}
