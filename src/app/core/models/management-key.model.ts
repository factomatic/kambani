import { KeyModel } from './key.model';

export class ManagementKeyModel extends KeyModel {
  constructor(
    public alias: string,
    public priority: number,
    public type: string,
    public controller: string,
    public publicKey: string,
    public privateKey?: string,
    public priorityRequirement?: number) {
      super(alias, type, controller, publicKey, privateKey);
      this.priority = priority;
      this.priorityRequirement = priorityRequirement;
    }
}