export interface DidKeyEntryModel {
  id: string,
  type: string,
  controller: string,
  publicKeyBase58?: string,
  publicKeyPem?: string,
  purpose?: [],
  priorityRequirement?: number
}