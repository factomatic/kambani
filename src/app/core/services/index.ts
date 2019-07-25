import { DialogsService } from './dialogs/dialogs.service';
import { SigningService } from './signing/signing.service';
import { VaultService } from './vault/vault.service';


import { DIDService } from './did/did.service';
import { GenerateKeysService } from './keys/generate.keys.service';
import { WorkflowService } from './workflow/workflow.service';

export const services = [
  DialogsService,
  SigningService,
  VaultService,
  DIDService,
  GenerateKeysService,
  WorkflowService
];
