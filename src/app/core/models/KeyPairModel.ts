export class KeyPairModel {
  constructor(
    public alias: string,
    public type: string,
    public publicKey: string,
    public privateKey: string
  ) { }
}
