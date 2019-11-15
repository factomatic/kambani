export class SignatureDataModel {
  constructor(
    public message: any,
    public publicKey: any,
    public signature: any,
    public signatureType: string
  ) { }
}
