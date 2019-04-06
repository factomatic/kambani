export class SignatureDataModel {
  constructor(
    public content: string,
    public keyType: string,
    public publicKey: string,
    public signature: string
  ) { }
}
