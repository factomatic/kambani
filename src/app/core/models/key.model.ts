export class KeyModel {
  constructor(
    public alias: string,
    public type: string,
    public controller: string,
    public publicKey: string,
    public privateKey?: string) {}
}
