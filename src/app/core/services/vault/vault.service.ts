import * as encryptor from 'browser-passworder';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import LocalStorageStore from 'obs-store/lib/localStorage';

import { environment } from 'src/environments/environment';
import { ImportResultModel } from '../../models/ImportResultModel';
import { KeyPairModel } from '../../models/KeyPairModel';

@Injectable()
export class VaultService {
  private encryptedVault: string;
  private localStorageStore: LocalStorageStore;

  constructor() {
    this.localStorageStore = new LocalStorageStore({ storageKey: environment.storageKey });

    const state = this.localStorageStore.getState();
    if (state) {
      this.encryptedVault = state.vault;
    }
  }

  createNewVault(password: string): Observable<void> {
    return defer(async () => {
      const newVault = JSON.stringify({});
      const encryptedVault = await encryptor.encrypt(password, newVault);

      this.localStorageStore.putState({
        vault: encryptedVault
      });

      this.encryptedVault = encryptedVault;
    });
  }

  restoreVault(encryptedVault: string, password: string): Observable<ImportResultModel> {
    return defer(async () => {
      try {
        const decryptedVault = JSON.parse(await encryptor.decrypt(password, encryptedVault));
        const publicKeys = Object.keys(decryptedVault);
        const publicKeysAliases = {};
        publicKeys.forEach(pk => {
          publicKeysAliases[pk] = decryptedVault[pk].alias;
        });

        this.localStorageStore.putState({
          vault: encryptedVault,
          publicKeys: JSON.stringify(publicKeys),
          publicKeysAliases: JSON.stringify(publicKeysAliases)
        });

        this.encryptedVault = encryptedVault;

        return new ImportResultModel(true, 'Restore was successful');
      } catch {
        return new ImportResultModel(false, 'Invalid vault password or type of vault backup');
      }
    });
  }

  async importKeys(keyPairs: KeyPairModel[], vaultPassword: string): Promise<ImportResultModel> {
    try {
      const vault = this.localStorageStore.getState().vault;

      let publicKeys = this.localStorageStore.getState().publicKeys;
      if (!publicKeys) {
        publicKeys = [];
      } else {
        publicKeys = JSON.parse(publicKeys);
      }

      let publicKeysAliases = this.localStorageStore.getState().publicKeysAliases;
      if (!publicKeysAliases) {
        publicKeysAliases = {};
      } else {
        publicKeysAliases = JSON.parse(publicKeysAliases);
      }

      const decryptedVault = JSON.parse(await encryptor.decrypt(vaultPassword, vault));

      for (const keyPair of keyPairs) {
        if (!publicKeys.includes(keyPair.publicKey)) {
          decryptedVault[keyPair.publicKey] = {
            alias: keyPair.alias,
            type: keyPair.type,
            privateKey: keyPair.privateKey
          };

          publicKeys.push(keyPair.publicKey);
          publicKeysAliases[keyPair.publicKey] = keyPair.alias;
        }
      }

      const encryptedVault = await encryptor.encrypt(vaultPassword, JSON.stringify(decryptedVault));
      this.encryptedVault = encryptedVault;

      this.localStorageStore.putState({
        vault: encryptedVault,
        publicKeys: JSON.stringify(publicKeys),
        publicKeysAliases: JSON.stringify(publicKeysAliases)
      });

      return new ImportResultModel(true, 'Import was successful');
    } catch {
      return new ImportResultModel(false, 'Incorrect vault password');
    }
  }

  removeVault(): void {
    localStorage.removeItem(environment.storageKey);
    this.encryptedVault = undefined;
  }

  getVault(): string {
    return this.localStorageStore.getState().vault;
  }

  getVaultPublicKeys(): string {
    return this.localStorageStore.getState().publicKeys;
  }

  getVaultPublicKeysAliases(): string {
    return this.localStorageStore.getState().publicKeysAliases;
  }

  vaultExists(): boolean {
    if (this.encryptedVault) {
      return true;
    }

    return false;
  }
}
