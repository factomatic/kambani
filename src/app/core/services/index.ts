import { DialogsService } from './dialogs/dialogs.service';
import { KeysService } from './keys/keys.service';
import { SigningService } from './signing/signing.service';
import { VaultService } from './vault/vault.service';

export const services = [
  DialogsService,
  KeysService,
  SigningService,
  VaultService
];
