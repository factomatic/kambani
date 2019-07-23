import { KeyModel } from './key.model';

export class ComponentKeyModel {
  constructor(
    public keyModel: KeyModel,
    public iconPosition: string,
    public disabled: boolean) {
  }
}
