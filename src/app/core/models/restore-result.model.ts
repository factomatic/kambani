export class RestoreResultModel {
  constructor(
    public success: boolean,
    public versionUpgraded: boolean,
    public message?: string
  ) { }
}