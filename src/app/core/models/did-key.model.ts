import { KeyModel } from './key.model';
import { PurposeType } from '../enums/purpose-type';

export class DidKeyModel extends KeyModel {
  constructor(
    public alias: string,
    public purpose: PurposeType[],
    public type: string,
    public controller: string,
    public publicKey: string,
    public privateKey?: string,
    public priorityRequirement?: number) {
      super(alias, type, controller, publicKey, privateKey);
      this.purpose = purpose;
      this.priorityRequirement = priorityRequirement;
    }
}