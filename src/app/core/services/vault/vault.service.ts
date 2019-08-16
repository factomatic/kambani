import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import * as encryptor from 'browser-passworder';
import * as forge from 'node-forge';
import * as nacl from 'tweetnacl/nacl-fast';
import { Buffer } from 'buffer/';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import LocalStorageStore from 'obs-store/lib/localStorage';

import { DIDDocument } from '../../interfaces/did-document';
import { DidKeyEntryModel } from '../../interfaces/did-key-entry';
import { DidKeyModel } from '../../models/did-key.model';
import { environment } from 'src/environments/environment';
import { ImportKeyModel } from '../../models/import-key.model'
import { ImportResultModel } from '../../models/import-result.model';
import { ManagementKeyEntryModel } from '../../interfaces/management-key-entry';
import { ManagementKeyModel } from '../../models/management-key.model';
import { modifyPemPrefixAndSuffix } from '../../utils/helpers';
import { ResultModel } from '../../models/result.model';
import { SignatureType} from '../../enums/signature-type';
import { ServiceEntryModel } from '../../interfaces/service-entry';
import { UpdateEntryDocument } from '../../interfaces/update-entry-document';

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
        didDocuments: JSON.stringify({})
      });

      this.encryptedVault = encryptedVault;
    });
  }

  saveDIDToVault(
    didId: string,
    didDocument: DIDDocument,
    managementKeys: ManagementKeyModel[],
    didKeys: DidKeyModel[],
    vaultPassword: string): Observable<ResultModel> {
      return defer(async () => {
        try {
          const decryptedVault = await encryptor.decrypt(vaultPassword, this.encryptedVault);

          const managementKeysVaultDict = {};
          for (const managementKey of managementKeys) {
            managementKeysVaultDict[managementKey.alias] = managementKey.privateKey;
          }

          const didKeysVaultDict = {};
          for (const didKey of didKeys) {
            didKeysVaultDict[didKey.alias] = didKey.privateKey;
          }

          decryptedVault[didId] = {
            managementKeys: managementKeysVaultDict,
            didKeys: didKeysVaultDict
          };

          const encryptedVault = await encryptor.encrypt(vaultPassword, decryptedVault);
          this.encryptedVault = encryptedVault;

          const didDocuments = this.getAllDIDDocuments();
          didDocuments[didId] = didDocument;

          this.localStorageStore.putState({
            vault: encryptedVault,
            didDocuments: JSON.stringify(didDocuments)
          });

          return new ResultModel(true, 'DID was successfully saved');
        } catch {
          return new ResultModel(false, 'Incorrect vault password');
        }
      });
  }

  saveDIDChangesToVault(
    didId: string,
    entry: UpdateEntryDocument,
    managementKeys: ManagementKeyModel[],
    didKeys: DidKeyModel[],
    vaultPassword: string): Observable<ResultModel> {
      return defer(async () => {
        try {
          const decryptedVault = await encryptor.decrypt(vaultPassword, this.encryptedVault);
          const didDocument = this.getDIDDocument(didId);
          const revokeObject = entry.revoke;
          const addObject = entry.add;

          const updateManagementKeysResult = this.updateManagementKeys(revokeObject, addObject, managementKeys, decryptedVault[didId].managementKeys, didDocument.managementKey);
          if (updateManagementKeysResult.anyChanges) {
            decryptedVault[didId].managementKeys = updateManagementKeysResult.managementKeysVaultDict;
            didDocument.managementKey = updateManagementKeysResult.managementKeysInDocument;
          }

          const updateDidKeysResult = this.updateDidKeys(revokeObject, addObject, didKeys, decryptedVault[didId].didKeys, didDocument.didKey);
          if (updateDidKeysResult.anyChanges) {
            decryptedVault[didId].didKeys = updateDidKeysResult.didKeysVaultDict;
            didDocument.didKey = updateDidKeysResult.didKeysInDocument;
          }

          const updateServicesResult = this.updateServices(revokeObject, addObject, didDocument.service);
          if (updateServicesResult.anyChanges) {
            didDocument.service = updateServicesResult.servicesInDocument;
          }

          const encryptedVault = await encryptor.encrypt(vaultPassword, decryptedVault);
          this.encryptedVault = encryptedVault;

          const allDidDocuments = this.getAllDIDDocuments();
          allDidDocuments[didId] = didDocument;

          this.localStorageStore.putState({
            vault: encryptedVault,
            didDocuments: JSON.stringify(allDidDocuments)
          });

          return new ResultModel(true, 'Vault state was successfully updated');
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
          didDocuments: JSON.stringify({})
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

  canDecryptVault(vaultPassword: string): Observable<ResultModel> {
    return defer(async () => {
      try {
        await encryptor.decrypt(vaultPassword, this.encryptedVault);
        return new ResultModel(true, 'Correct vault password');
      } catch {
        return new ResultModel(false, 'Incorrect vault password');
      }
    });
  }

  getVault(): string {
    return this.encryptedVault;
  }

  getAllDIDDocuments(): object {
    return JSON.parse(this.localStorageStore.getState().didDocuments);
  }

  getAllDIDIds(): string[] {
    const didDocuments = this.getAllDIDDocuments();
    return Object.keys(didDocuments);
  }

  getDIDDocument(didId: string): DIDDocument {
    const dids = this.getAllDIDDocuments();
    return dids[didId];
  }

  didDocumentsAny(): boolean {
    const didDocuments = this.getAllDIDDocuments();
    return Object.keys(didDocuments).length > 0;
  }

  vaultExists(): boolean {
    if (this.encryptedVault) {
      return true;
    }

    return false;
  }

  private updateManagementKeys(
    revokeObject: any,
    addObject: any,
    managementKeys: ManagementKeyModel[],
    managementKeysVaultDict: object,
    managementKeysInDocument: ManagementKeyEntryModel[]) {
      const anyRevokedManagementKeys = revokeObject != undefined && revokeObject.managementKey != undefined;
      const anyAddedManagementKeys = addObject != undefined && addObject.managementKey != undefined;

      if (anyRevokedManagementKeys || anyAddedManagementKeys) {
        if (anyRevokedManagementKeys) {
          for (const revokeKeyObject of revokeObject.managementKey) {
            const keyAlias = revokeKeyObject.id.split('#')[1];
            delete managementKeysVaultDict[keyAlias];
            managementKeysInDocument = managementKeysInDocument.filter(k => k.id != revokeKeyObject.id);
          }
        }

        if (anyAddedManagementKeys) {
          if (!managementKeysInDocument) {
            managementKeysInDocument = [];
          }
      
          for (const keyEntryModel of addObject.managementKey) {
            const keyModel = managementKeys.find(k => k.alias === keyEntryModel.id.split('#')[1]);
            managementKeysVaultDict[keyModel.alias] = keyModel.privateKey;
            managementKeysInDocument.push(keyEntryModel);
          }
        }

        return {
          anyChanges: true,
          managementKeysVaultDict,
          managementKeysInDocument
        };
      }
      
      return {
        anyChanges: false
      };
  }

  private updateDidKeys(
    revokeObject: any,
    addObject: any,
    didKeys: DidKeyModel[],
    didKeysVaultDict: object,
    didKeysInDocument: DidKeyEntryModel[]) {
      const anyRevokedDidKeys = revokeObject != undefined && revokeObject.didKey != undefined;
      const anyAddedDidKeys = addObject != undefined && addObject.didKey != undefined;

      if (anyRevokedDidKeys || anyAddedDidKeys) {
        if (anyRevokedDidKeys) {
          for (const revokeKeyObject of revokeObject.didKey) {
            const keyAlias = revokeKeyObject.id.split('#')[1];
            delete didKeysVaultDict[keyAlias];
            didKeysInDocument = didKeysInDocument.filter(k => k.id != revokeKeyObject.id);
          }
        }

        if (anyAddedDidKeys) {
          if (!didKeysInDocument) {
            didKeysInDocument = [];
          }
      
          for (const keyEntryModel of addObject.didKey) {
            const keyModel = didKeys.find(k => k.alias === keyEntryModel.id.split('#')[1]);
            didKeysVaultDict[keyModel.alias] = keyModel.privateKey;
            didKeysInDocument.push(keyEntryModel);
          }
        }

        return {
          anyChanges: true,
          didKeysVaultDict,
          didKeysInDocument
        };
      }
      
      return {
        anyChanges: false
      };
  }

  private updateServices(
    revokeObject: any,
    addObject: any,
    servicesInDocument: ServiceEntryModel[]) {
      const anyRevokedServices = revokeObject != undefined && revokeObject.service != undefined;
      const anyAddedServices = addObject != undefined && addObject.service != undefined;

      if (anyRevokedServices || anyAddedServices) {
        if (anyRevokedServices) {
          for (const revokeServiceObject of revokeObject.service) {
            servicesInDocument = servicesInDocument.filter(s => s.id != revokeServiceObject.id);
          }
        }

        if (anyAddedServices) {
          if (!servicesInDocument) {
            servicesInDocument = [];
          }

          for (const serviceEntryModel of addObject.service) {
            servicesInDocument.push(serviceEntryModel);
          }
        }

        return {
          anyChanges: true,
          servicesInDocument
        };
      }

      return {
        anyChanges: false
      };
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
