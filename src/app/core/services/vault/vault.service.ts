import * as encryptor from 'browser-passworder';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import LocalStorageStore from 'obs-store/lib/localStorage';

import { BackupResultModel } from '../../models/backup-result.model';
import { DIDDocument } from '../../interfaces/did-document';
import { DidKeyEntryModel } from '../../interfaces/did-key-entry';
import { DidKeyModel } from '../../models/did-key.model';
import { environment } from 'src/environments/environment';
import { FactomKeyType } from '../../enums/factom-key-type';
import { ManagementKeyEntryModel } from '../../interfaces/management-key-entry';
import { ManagementKeyModel } from '../../models/management-key.model';
import { ResultModel } from '../../models/result.model';
import { ServiceEntryModel } from '../../interfaces/service-entry';
import { UpdateEntryDocument } from '../../interfaces/update-entry-document';

@Injectable()
export class VaultService {
  private localStorageStore: LocalStorageStore;

  constructor() {
    this.localStorageStore = new LocalStorageStore({ storageKey: environment.storageKey });
  }

  createNewVault(password: string): Observable<void> {
    return defer(async () => {
      const newVault = {};
      const encryptedVault = await encryptor.encrypt(password, newVault);

      this.localStorageStore.putState({
        vault: encryptedVault,
        didsPublicInfo: JSON.stringify({}),
        factomKeysPublicInfo: JSON.stringify({
          [FactomKeyType.FCT]: {},
          [FactomKeyType.EC]: {}
        }),
        createdDIDsCount: 0,
        signedRequestsCount: 0,
        signedRequestsData: JSON.stringify(new Array(7).fill(0)),
        dateOfLastSignedRequest: undefined
      });
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
          const state = this.localStorageStore.getState();
          const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);

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

          const createdDIDsCount = state.createdDIDsCount + 1;
          const didNickname = `did-${createdDIDsCount}`;

          const didsPublicInfo = JSON.parse(state.didsPublicInfo);
          didsPublicInfo[didId] = {
            nickname: didNickname,
            didDocument: didDocument
          };

          const newState = Object.assign({}, state, {
            vault: encryptedVault,
            didsPublicInfo: JSON.stringify(didsPublicInfo),
            createdDIDsCount: createdDIDsCount
          });

          this.localStorageStore.putState(newState);

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
          const state = this.localStorageStore.getState();
          const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);
          const didsPublicInfo = JSON.parse(state.didsPublicInfo);

          const didNickname = didsPublicInfo[didId].nickname;
          const didDocument: DIDDocument = didsPublicInfo[didId].didDocument;
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

          didsPublicInfo[didId] = {
            nickname: didNickname,
            didDocument: didDocument
          };

          const newState = Object.assign({}, state, {
            vault: encryptedVault,
            didsPublicInfo: JSON.stringify(didsPublicInfo)
          });

          this.localStorageStore.putState(newState);

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

        return new ResultModel(true, 'Restore was successful');
      } catch {
        return new ResultModel(false, 'Invalid vault password or type of vault backup');
      }
    });
  }

  removeVault(): void {
    localStorage.removeItem(environment.storageKey);
  }

  canDecryptVault(vaultPassword: string): Observable<ResultModel> {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        await encryptor.decrypt(vaultPassword, state.vault);
        return new ResultModel(true, 'Correct vault password');
      } catch {
        return new ResultModel(false, 'Incorrect vault password');
      }
    });
  }

  backupSingleDIDFromVault(didId: string, vaultPassword: string) {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);
        const didKeys = decryptedVault[didId];
        const didKeysBackup = await encryptor.encrypt(vaultPassword, didKeys);

        return new BackupResultModel(true, 'Successful DID backup', didKeysBackup);
      } catch {
        return new BackupResultModel(false, 'Incorrect vault password');
      }
    });
  }

  updateSignedRequests() {
    const state = this.localStorageStore.getState();
    let dateOfLastSignedRequest = state.dateOfLastSignedRequest;
    let signedRequestsData = JSON.parse(state.signedRequestsData);

     // Sunday -> 0, Monday -> 1, ..., Saturday -> 6
     let now = new Date();
     if (dateOfLastSignedRequest == now.toDateString()) {
       signedRequestsData[now.getDay()] += 1;
     } else {
       signedRequestsData[now.getDay()] = 1;
       dateOfLastSignedRequest = now.toDateString();
     }

    const newState = Object.assign({}, state, {
      signedRequestsCount: state.signedRequestsCount + 1,
      signedRequestsData: JSON.stringify(signedRequestsData),
      dateOfLastSignedRequest: dateOfLastSignedRequest
    });

    this.localStorageStore.putState(newState);
  }

  updateDIDNickname(didId: string, nickname: string) {
    const state = this.localStorageStore.getState();
    const didsPublicInfo = JSON.parse(state.didsPublicInfo);

    didsPublicInfo[didId] = {
      nickname: nickname,
      didDocument: didsPublicInfo[didId].didDocument
    };

    const newState = Object.assign({}, state, {
      didsPublicInfo: JSON.stringify(didsPublicInfo)
    });

    this.localStorageStore.putState(newState);
  }

  importFactomKey(type: FactomKeyType, nickname: string, publicKey: string, privateKey: string, vaultPassword: string) {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);

        decryptedVault[publicKey] = privateKey;
        const encryptedVault = await encryptor.encrypt(vaultPassword, decryptedVault);

        const factomKeysPublicInfo = JSON.parse(state.factomKeysPublicInfo);
        factomKeysPublicInfo[type] = Object.assign({}, factomKeysPublicInfo[type], {
          [publicKey]: nickname
        });

        const newState = Object.assign({}, state, {
          vault: encryptedVault,
          factomKeysPublicInfo: JSON.stringify(factomKeysPublicInfo)
        });

        this.localStorageStore.putState(newState);

        return new ResultModel(true, 'Key was successfully imported');
      } catch {
        return new ResultModel(false, 'Incorrect vault password');
      }
    });
  }

  getVault(): string {
    return this.localStorageStore.getState().vault;
  }

  getAllDIDsPublicInfo() {
    return JSON.parse(this.localStorageStore.getState().didsPublicInfo);
  }

  getDIDsCount(): number {
    return Object.keys(this.getAllDIDsPublicInfo()).length;
  }

  getSignedRequestsCount(): number {
    return this.localStorageStore.getState().signedRequestsCount;
  }

  getSignedRequestsData(): number[] {
    return JSON.parse(this.localStorageStore.getState().signedRequestsData);
  }

  getDIDPublicInfo(didId: string) {
    const didsPublicInfo = this.getAllDIDsPublicInfo();
    return didsPublicInfo[didId];
  }

  getFCTKeysPublicInfo() {
    return JSON.parse(this.localStorageStore.getState().factomKeysPublicInfo)[FactomKeyType.FCT];
  }

  getECKeysPublicInfo() {
    return JSON.parse(this.localStorageStore.getState().factomKeysPublicInfo)[FactomKeyType.EC];
  }

  anyDIDs(): boolean {
    return Object.keys(this.getAllDIDsPublicInfo()).length > 0;
  }

  vaultExists(): boolean {
    try {
      if (this.localStorageStore.getState().vault) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
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
}