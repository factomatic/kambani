import { DidKeyModel } from './did-key.model';
import { ManagementKeyModel } from './management-key.model';
import { PurposeType } from '../enums/purpose-type';

export class ComponentKeyModel {
  constructor(
    public keyModel: ManagementKeyModel | DidKeyModel,
    public iconPosition: string,
    public disabled: boolean,
    public purposes?: any[]) {
      if (keyModel['purpose']) {
        this.purposes = [
          { name: 'Public Key', value: PurposeType.PublicKey, checked: keyModel['purpose'].includes(PurposeType.PublicKey) },
          { name: 'Authentication Key', value: PurposeType.AuthenticationKey, checked: keyModel['purpose'].includes(PurposeType.AuthenticationKey) }
        ]
      }
  }
}
