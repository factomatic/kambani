import { DidKeyModel } from './did-key.model';
import { ManagementKeyModel } from './management-key.model';
import { ServiceModel } from './service.model';

export class UpdateDIDModel {
  didId: string;
  managementKeys: ManagementKeyModel[];
  didKeys: DidKeyModel[];
  services: ServiceModel[];
  originalManagementKeys: ManagementKeyModel[];
  originalDidKeys: DidKeyModel[];
  originalServices: ServiceModel[];

  constructor(
    didId: string,
    managementKeys: ManagementKeyModel[],
    didKeys: DidKeyModel[],
    services: ServiceModel[]
  ) {
    this.didId = didId;
    this.managementKeys = managementKeys;
    this.didKeys = didKeys;
    this.services = services;
    this.originalManagementKeys = managementKeys;
    this.originalDidKeys = didKeys;
    this.originalServices = services;
  }
}