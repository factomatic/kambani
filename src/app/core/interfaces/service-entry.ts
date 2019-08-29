export interface ServiceEntryModel {
  id: string,
  type: string,
  serviceEndpoint: string,
  priorityRequirement?: number
}