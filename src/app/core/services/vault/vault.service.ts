import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import * as encryptor from 'browser-passworder';
import * as forge from 'node-forge';
import * as nacl from 'tweetnacl/nacl-fast';
import { Buffer } from 'buffer/';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import LocalStorageStore from 'obs-store/lib/localStorage';

import { DidKeyModel } from '../../models/did-key.model';
import { environment } from 'src/environments/environment';
import { ImportKeyModel } from '../../models/import-key.model'
import { ImportResultModel } from '../../models/import-result.model';
import { ManagementKeyModel } from '../../models/management-key.model';
import { modifyPemPrefixAndSuffix } from '../../utils/helpers';
import { ResultModel } from '../../models/result.model';
import { ServiceModel } from '../../models/service.model';
import { SignatureType} from '../../enums/signature-type';

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
      const newVault = {};
      const encryptedVault = await encryptor.encrypt(password, newVault);

      this.localStorageStore.putState({
        vault: encryptedVault,
        dids: JSON.stringify({})
      });

      this.encryptedVault = encryptedVault;
    });
  }

  saveDIDToVault(
    didId: string,
    managementKeys: ManagementKeyModel[],
    didKeys: DidKeyModel[],
    services: ServiceModel[],
    vaultPassword: string): Observable<ResultModel> {
      return defer(async () => {
        try {
          const decryptedVault = await encryptor.decrypt(vaultPassword, this.encryptedVault);

          const managementKeysVaultDict = {};
          const managementKeysPublicInfoDict = {};
          for (const managementKey of managementKeys) {
            managementKeysVaultDict[managementKey.alias] = managementKey.privateKey;
            managementKeysPublicInfoDict[managementKey.alias] = {
              type: managementKey.type,
              controller: managementKey.controller,
              publicKey: managementKey.publicKey,
              priority: managementKey.priority
            };
          }

          const didKeysVaultDict = {};
          const didKeysPublicInfoDict = {};
          for (const didKey of didKeys) {
            didKeysVaultDict[didKey.alias] = didKey.privateKey;
            didKeysPublicInfoDict[didKey.alias] = {
              type: didKey.type,
              controller: didKey.controller,
              purpose: didKey.purpose,
              publicKey: didKey.publicKey,
              priorityRequirement: didKey.priorityRequirement
            };
          }

          decryptedVault[didId] = {
            managementKeys: managementKeysVaultDict,
            didKeys: didKeysVaultDict
          };

          const encryptedVault = await encryptor.encrypt(vaultPassword, decryptedVault);
          this.encryptedVault = encryptedVault;

          const dids = this.getDIDs();
          dids[didId] = {
            managementKeys: managementKeysPublicInfoDict,
            didKeys: didKeysPublicInfoDict,
            services: services
          };

          this.localStorageStore.putState({
            vault: encryptedVault,
            dids: JSON.stringify(dids)
          });

          return new ResultModel(true, 'DID was successfully saved');
        } catch {
          return new ResultModel(false, 'Incorrect vault password');
        }
      });
  }

  restoreVault(encryptedVault: string, password: string): Observable<ResultModel> {
    return defer(async () => {
      try {
        this.localStorageStore.putState({
          vault: encryptedVault,
          dids: JSON.stringify({})
        });

        this.encryptedVault = encryptedVault;

        return new ResultModel(true, 'Restore was successful');
      } catch {
        return new ResultModel(false, 'Invalid vault password or type of vault backup');
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

  getDIDs(): object{
    return JSON.parse(this.localStorageStore.getState().dids);
  }

  vaultExists(): boolean {
    if (this.encryptedVault) {
      return true;
    }

    return false;
  }
  
  /**
  * @deprecated method.
  */
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

  /**
  * @deprecated method.
  */
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

  /**
  * @deprecated method.
  */
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

  /**
  * @deprecated method.
  */
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

  /**
  * @deprecated method.
  */
  private extractEncryptedKeys(file: string): string {
    const parsedFile = JSON.parse(file);
    const keysFile: any = { };

    keysFile.data = parsedFile.data;
    keysFile.iv = parsedFile.encryptionAlgo.iv;
    keysFile.salt = parsedFile.encryptionAlgo.salt;

    return JSON.stringify(keysFile);
  }
}
