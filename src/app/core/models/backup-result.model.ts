export class BackupResultModel {
  constructor(
    public success: boolean,
    public message: string,
    public backup?: string
  ) { }
}