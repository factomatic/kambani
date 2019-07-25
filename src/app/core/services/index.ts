import { DialogsService } from './dialogs/dialogs.service';
import { DIDService } from './did/did.service';
import { KeysService } from './keys/keys.service';
import { SigningService } from './signing/signing.service';
import { VaultService } from './vault/vault.service';
import { WorkflowService } from './workflow/workflow.service';

export const services = [
  DialogsService,
  DIDService,
  KeysService,
  SigningService,
  VaultService,
  WorkflowService
];
