import { DidKeyModel } from '../../models/did-key.model';
import { ManagementKeyModel } from '../../models/management-key.model';
import { ServiceModel } from '../../models/service.model';

export interface CreateDIDState {
  readonly managementKeys: ManagementKeyModel[];
  readonly didKeys: DidKeyModel[];
  readonly services: ServiceModel[];
}
