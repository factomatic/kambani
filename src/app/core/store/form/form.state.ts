import { DidKeyModel } from '../../models/did-key.model';
import { ManagementKeyModel } from '../../models/management-key.model';
import { ServiceModel } from '../../models/service.model';

export interface FormState {
  readonly managementKeys: ManagementKeyModel[];
  readonly didKeys: DidKeyModel[];
  readonly services: ServiceModel[];
  readonly originalManagementKeys: ManagementKeyModel[];
  readonly originalDidKeys: DidKeyModel[];
  readonly originalServices: ServiceModel[];
}
