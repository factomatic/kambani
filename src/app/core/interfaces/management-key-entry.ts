export interface ManagementKeyEntryModel {
  id: string,
  type: string,
  controller: string,
  publicKeyBase58?: string,
  publicKeyPem?: string,
  priority?: number,
  priorityRequirement?: number
}