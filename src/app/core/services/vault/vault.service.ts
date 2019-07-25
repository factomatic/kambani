import * as encryptor from 'browser-passworder';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import LocalStorageStore from 'obs-store/lib/localStorage';

import { environment } from 'src/environments/environment';
import { ImportKeyModel } from '../../models/import-key.model'
import { ImportResultModel } from '../../models/import-result.model';

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

  async importKeys(keys: ImportKeyModel[], vaultPassword: string): Promise<ImportResultModel> {
    try {
      const vault = this.encryptedVault;

      let publicKeys = this.localStorageStore.getState().publicKeys;
      let publicKeysAliases = this.localStorageStore.getState().publicKeysAliases;
      if (!publicKeys) {
        publicKeys = [];
        publicKeysAliases = {};
      } else {
        publicKeys = JSON.parse(publicKeys);
        publicKeysAliases = JSON.parse(publicKeysAliases);
      }
      
      const decryptedVault = JSON.parse(await encryptor.decrypt(vaultPassword, vault));

      for (const key of keys) {
        if (!publicKeys.includes(key.publicKey)) {
          decryptedVault[key.publicKey] = {
            alias: key.alias,
            type: key.type,
            privateKey: key.privateKey
          };

          publicKeys.push(key.publicKey);
          publicKeysAliases[key.publicKey] = key.alias;
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
    return this.encryptedVault;
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
