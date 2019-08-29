export class SignatureResultModel {
  constructor(
    public success: boolean,
    public message: string,
    public signatureBase64?: string
  ) { }
}