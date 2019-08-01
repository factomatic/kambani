import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import * as encryptor from 'browser-passworder';
import * as forge from 'node-forge';
import * as nacl from 'tweetnacl/nacl-fast';
import { Buffer } from 'buffer/';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import LocalStorageStore from 'obs-store/lib/localStorage';

import { environment } from 'src/environments/environment';
import { ImportKeyModel } from '../../models/import-key.model'
import { ImportResultModel } from '../../models/import-result.model';
import { modifyPemPrefixAndSuffix } from '../../utils/helpers';
import { SignatureType} from '../../enums/signature-type'

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

  importKeysFromJsonFile(file: string, filePassword: string, vaultPassword: string): Observable<ImportResultModel> {
    return defer(async() => {
      try {
        const decryptedFile = JSON.parse(await encryptor.decrypt(filePassword, this.extractEncryptedKeys(file)));
        const importKeysModels: ImportKeyModel[] = [];

        if (Array.isArray(decryptedFile) && decryptedFile.length > 0) {
          for (const keyModel of decryptedFile) {
            if (keyModel.alias && keyModel.type && keyModel.privateKey) {
              const importKeyModel = this.getImportKeyModel(keyModel.alias, keyModel.type, keyModel.privateKey);
              importKeysModels.push(importKeyModel);
            }
          }

          return await this.importKeys(importKeysModels, vaultPassword);
        } else {
          return new ImportResultModel(false, 'Invalid type of keystore');
        }
      } catch {
        return new ImportResultModel(false, 'Invalid file password or type of keystore');
      }
    });
  }

  importKeysFromPrivateKey(alias: string, type: string, privateKey: string, vaultPassword: string): Observable<ImportResultModel> {
    return defer(async () => {
      try {
        const importKeyModel = this.getImportKeyModel(alias, type, privateKey);
        const importKeysModels = [importKeyModel];

        return await this.importKeys(importKeysModels, vaultPassword);
      } catch {
        return new ImportResultModel(false, 'Invalid private key');
      }
    });
  }

  private async importKeys(keys: ImportKeyModel[], vaultPassword: string): Promise<ImportResultModel> {
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

  private getImportKeyModel(alias: string, type: string, privateKey: string): ImportKeyModel {
    if (type === SignatureType.EdDSA) {
      const keyPair = nacl.sign.keyPair.fromSecretKey(base58.decode(privateKey));
      const publicKey = base58.encode(Buffer.from(keyPair.publicKey));

      return new ImportKeyModel(alias, type, publicKey, privateKey);
    } else if (type === SignatureType.ECDSA) {
      const ec = elliptic.ec('secp256k1');
      const key = ec.keyFromPrivate(base58.decode(privateKey), 'hex');

      const compressedPubPoint = key.getPublic(true, 'hex');
      const publicKey = base58.encode(Buffer.from(compressedPubPoint, 'hex'));

      return new ImportKeyModel(alias, type, publicKey, privateKey);
    } else if (type === SignatureType.RSA) {
      const forgePrivateKey = forge.pki.privateKeyFromPem(privateKey);
      const publicKey = forge.pki.setRsaPublicKey(forgePrivateKey.n, forgePrivateKey.e);
      let publicKeyPem = forge.pki.publicKeyToPem(publicKey);
      publicKeyPem = modifyPemPrefixAndSuffix(publicKeyPem);

      return new ImportKeyModel(alias, type, publicKeyPem, privateKey);
    }
  }

  private extractEncryptedKeys(file: string): string {
    const parsedFile = JSON.parse(file);
    const keysFile: any = { };

    keysFile.data = parsedFile.data;
    keysFile.iv = parsedFile.encryptionAlgo.iv;
    keysFile.salt = parsedFile.encryptionAlgo.salt;

    return JSON.stringify(keysFile);
  }
}
