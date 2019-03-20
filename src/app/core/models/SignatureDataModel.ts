export class SignatureDataModel {
  constructor(
    public keyType: string,
    public publicKey: string,
    public signature: string
  ) { }
}
