import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import * as encryptor from 'browser-passworder';
import * as nacl from 'tweetnacl/nacl-fast';
import * as naclUtil from 'tweetnacl-util';
import { Buffer } from 'buffer/';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import LocalStorageStore from 'obs-store/lib/localStorage';

import { environment } from 'src/environments/environment';
import { ImportResultModel } from '../../models/ImportResultModel';
import { KeyPairModel } from '../../models/KeyPairModel';
import { KeyTypes } from '../../enums/key-types';
import { SignatureDataModel } from '../../models/SignatureDataModel';

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

      return new ImportResultModel(true, 'Successful import');
    } catch {
      return new ImportResultModel(false, 'Incorrect vault password');
    }
  }

  signData(data: string, publicKey: string, vaultPassword: string): Observable<SignatureDataModel> {
    return defer(async () => {
      try {
        const vault = this.localStorageStore.getState().vault;
        const decryptedVault = JSON.parse(await encryptor.decrypt(vaultPassword, vault));
        const privateKey = decryptedVault[publicKey].privateKey;
        const keyType = decryptedVault[publicKey].type;
        const dataToSign = Buffer.from(data, 'utf8');
        const signature = this.getSignature(dataToSign, keyType, privateKey);

        return new SignatureDataModel(keyType, publicKey, signature);
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

  getVaultPublicKeysAliases(): string {
    return this.localStorageStore.getState().publicKeysAliases;
  }

  vaultExists(): boolean {
    if (this.encryptedVault) {
      return true;
    }

    return false;
  }

  private getSignature(dataToSign: Buffer, keyType: KeyTypes, privateKey: string): string {
    if (keyType === KeyTypes.Ed25519) {
      const secret = Buffer.from(base58.decode(privateKey));
      const keyPair = nacl.sign.keyPair.fromSecretKey(secret);

      const signature = nacl.sign.detached(dataToSign, keyPair.secretKey);
      const signatureBase64 = naclUtil.encodeBase64(signature);

      return signatureBase64;
    } else if (keyType === KeyTypes.Secp256k1) {
      const ec = elliptic.ec('secp256k1');
      const key = ec.keyFromPrivate(base58.decode(privateKey), 'hex');
      const signature = key.sign(dataToSign);

      const derSignature = signature.toDER();
      const signatureBase64 = naclUtil.encodeBase64(derSignature);

      return signatureBase64;
    }
  }
}
