import { DidKeyModel } from './did-key.model';
import { ManagementKeyModel } from './management-key.model';

export class ComponentKeyModel {
  constructor(
    public keyModel: ManagementKeyModel | DidKeyModel,
    public iconPosition: string,
    public disabled: boolean) {
  }
}
