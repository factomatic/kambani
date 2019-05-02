export class SignatureDataModel {
  constructor(
    public content: string,
    public signatureType: string,
    public publicKey: string,
    public signature: string
  ) { }
}
