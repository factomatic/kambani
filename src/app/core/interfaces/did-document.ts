export interface DIDDocument {
  ['@context']: string;
  id: string;
  authentication: any[];
  publicKey: any[];
  service: any[];
}
