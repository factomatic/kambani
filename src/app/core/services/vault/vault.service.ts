import * as encryptor from 'browser-passworder';
import * as base58 from 'bs58';
import * as nacl from 'tweetnacl/nacl-fast';
import * as naclUtil from 'tweetnacl-util';
import { Buffer } from 'buffer/';
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
        const decryptedVaultJson = await encryptor.decrypt(password, encryptedVault);
        const decryptedVault = JSON.parse(decryptedVaultJson);
        const publicKeys = Object.keys(decryptedVault);

        this.localStorageStore.putState({
          vault: encryptedVault,
          publicKeys: JSON.stringify(publicKeys)
        });

        this.encryptedVault = encryptedVault;

        return new ImportResultModel(true, 'Successful restore');
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

      const decryptedVaultJson = await encryptor.decrypt(vaultPassword, vault);
      const decryptedVault = JSON.parse(decryptedVaultJson);

      for (const keyPair of keyPairs) {
        if (!publicKeys.includes(keyPair.publicKey)) {
          decryptedVault[keyPair.publicKey] = keyPair.privateKey;
          publicKeys.push(keyPair.publicKey);
        }
      }

      const encryptedVault = await encryptor.encrypt(vaultPassword, JSON.stringify(decryptedVault));
      this.encryptedVault = encryptedVault;

      this.localStorageStore.putState({
        vault: encryptedVault,
        publicKeys: JSON.stringify(publicKeys)
      });

      return new ImportResultModel(true, 'Successful import');
    } catch {
      return new ImportResultModel(false, 'Incorrect vault password');
    }
  }

  signData(data: string, publicKey: string, vaultPassword: string): Observable<string> {
    return defer(async () => {
      try {
        const vault = this.localStorageStore.getState().vault;

        let decryptedVault = await encryptor.decrypt(vaultPassword, vault);
        decryptedVault = JSON.parse(decryptedVault);
        const privateKey = decryptedVault[publicKey];
        const dataToSign = Buffer.from(data, 'utf8');

        const secret = Buffer.from(base58.decode(privateKey));
        const keyPair = nacl.sign.keyPair.fromSecretKey(secret);

        const signature = nacl.sign.detached(dataToSign, keyPair.secretKey);
        const signatureBase64 = naclUtil.encodeBase64(signature);

        return signatureBase64;
      } catch {
        return undefined;
      }
    });
  }

  getVault(): string {
    return this.localStorageStore.getState().vault;
  }

  getVaultPublicKeys(): string {
    return this.localStorageStore.getState().publicKeys;
  }

  vaultExists(): boolean {
    if (this.encryptedVault) {
      return true;
    }

    return false;
  }
}
