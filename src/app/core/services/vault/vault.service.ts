import * as encryptor from 'browser-passworder';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import LocalStorageStore from 'obs-store/lib/localStorage';

import { BackupResultModel } from '../../models/backup-result.model';
import { DIDDocument } from '../../interfaces/did-document';
import { DidKeyEntryModel } from '../../interfaces/did-key-entry';
import { DidKeyModel } from '../../models/did-key.model';
import { environment } from 'src/environments/environment';
import { FactomAddressType } from '../../enums/factom-address-type';
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
        version: environment.localStorageVersion,
        vault: encryptedVault,
        didsPublicInfo: JSON.stringify({}),
        factomAddressesPublicInfo: JSON.stringify({
          [FactomAddressType.FCT]: {},
          [FactomAddressType.EC]: {}
        }),
        createdDIDsCount: 0,
        createdFCTAddressesCount: 0,
        createdECAddressesCount: 0,
        signedRequestsCount: 0,
        signedRequestsData: JSON.stringify(new Array(7).fill(0)),
        dateOfLastShift: new Date().toDateString()
      });

      chrome.storage.sync.set({
        fctAddresses: [],
        ecAddresses: []
      })
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
          const didNickname = `identity-${createdDIDsCount}`;

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

          return new ResultModel(true, 'The Identity was saved successfully');
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

          return new ResultModel(true, 'Vault state was updated successfully');
        } catch {
          return new ResultModel(false, 'Incorrect vault password');
        }
      });
  }

  removeDIDFromVault(didId: string, vaultPassword: string): Observable<ResultModel> {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        let decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);

        let didsPublicInfo = JSON.parse(state.didsPublicInfo);
        delete didsPublicInfo[didId];
        delete decryptedVault[didId];

        const encryptedVault = await encryptor.encrypt(vaultPassword, decryptedVault);

        const newState = Object.assign({}, state, {
          vault: encryptedVault,
          didsPublicInfo: JSON.stringify(didsPublicInfo)
        });

        this.localStorageStore.putState(newState);

        return new ResultModel(true, 'The Identity was deleted successfully');
      } catch {
        return new ResultModel(false, 'Incorrect vault password');
      }
    });
  }

  restoreVault(encryptedState: string, vaultPassword: string): Observable<ResultModel> {
    return defer(async () => {
      try {
        const decryptedState = await encryptor.decrypt(vaultPassword, encryptedState);
        if (this.isValidState(decryptedState)) {
          this.localStorageStore.putState(decryptedState);

          const fctAddressesPublicInfo = this.getFCTAddressesPublicInfo();
          const ecAddressesPublicInfo = this.getECAddressesPublicInfo();

          chrome.storage.sync.get(['fctAddresses', 'ecAddresses'], function(addressesState) {
            let fctAddresses = [];
            let ecAddresses = [];

            for (const fctPublicAddress of Object.keys(fctAddressesPublicInfo)) {
              fctAddresses.push({[fctPublicAddress]: fctAddressesPublicInfo[fctPublicAddress]});
            }

            for (const ecPublicAddress of Object.keys(ecAddressesPublicInfo)) {
              ecAddresses.push({[ecPublicAddress]: ecAddressesPublicInfo[ecPublicAddress]});
            }

            addressesState.fctAddresses = fctAddresses;
            addressesState.ecAddresses = ecAddresses;

            chrome.storage.sync.set(addressesState);       
          });

          this.updateSignedRequestsData();

          return new ResultModel(true, 'Successful restore');
        }

        return new ResultModel(false, 'Invalid vault backup');
      } catch {
        return new ResultModel(false, 'Invalid vault password or type of vault backup');
      }
    });
  }

  removeVault(): void {
    localStorage.removeItem(environment.storageKey);
    chrome.storage.sync.clear();
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

  backupSingleDIDFromVault(didId: string, vaultPassword: string): Observable<BackupResultModel> {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);
        const didKeys = decryptedVault[didId];
        const didKeysBackup = await encryptor.encrypt(vaultPassword, didKeys);

        return new BackupResultModel(true, 'Successful Identity backup', didKeysBackup);
      } catch {
        return new BackupResultModel(false, 'Incorrect vault password');
      }
    });
  }

  updateSignedRequestsData() {
    const state = this.localStorageStore.getState();
    let dateOfLastShift = state.dateOfLastShift;
    let signedRequestsData = JSON.parse(state.signedRequestsData);

    let today = new Date().toDateString();
    if (dateOfLastShift !== today) {
      const diffTime = Date.parse(today) - Date.parse(dateOfLastShift);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        signedRequestsData = signedRequestsData.slice(diffDays, signedRequestsData.length).concat(new Array(diffDays).fill(0));
      } else {
        signedRequestsData = new Array(7).fill(0);
      }
      
      dateOfLastShift = today;
    }

    const newState = Object.assign({}, state, {
      signedRequestsData: JSON.stringify(signedRequestsData),
      dateOfLastShift: dateOfLastShift
    });

    this.localStorageStore.putState(newState);
  }

  incrementSignedRequests() {
    const state = this.localStorageStore.getState();
    let signedRequestsData = JSON.parse(state.signedRequestsData);
    signedRequestsData[signedRequestsData.length - 1] += 1;

    const newState = Object.assign({}, state, {
      signedRequestsCount: state.signedRequestsCount + 1,
      signedRequestsData: JSON.stringify(signedRequestsData)
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

  importFactomAddress(type: FactomAddressType, publicAddress: string, privateAddress: string, vaultPassword: string, nickname?: string) {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);

        decryptedVault[publicAddress] = privateAddress;
        const encryptedVault = await encryptor.encrypt(vaultPassword, decryptedVault);

        let fctAddressesCount = state.createdFCTAddressesCount;
        let ecAddressesCount = state.createdECAddressesCount;
        if (!nickname) {
          nickname = type == FactomAddressType.FCT
            ? `fct-address-${++fctAddressesCount}`
            : `ec-address-${++ecAddressesCount}`;
        }

        const factomAddressesPublicInfo = JSON.parse(state.factomAddressesPublicInfo);
        factomAddressesPublicInfo[type] = Object.assign({}, factomAddressesPublicInfo[type], {
          [publicAddress]: nickname
        });

        const newState = Object.assign({}, state, {
          vault: encryptedVault,
          factomAddressesPublicInfo: JSON.stringify(factomAddressesPublicInfo),
          createdFCTAddressesCount: fctAddressesCount,
          createdECAddressesCount: ecAddressesCount
        });

        this.localStorageStore.putState(newState);

        chrome.storage.sync.get(['fctAddresses', 'ecAddresses'], function(addressesState) {
          if (type === FactomAddressType.FCT) {
            if (addressesState.fctAddresses) {
              addressesState.fctAddresses.push({[publicAddress]: nickname});
            } else {
              addressesState.fctAddresses = [{[publicAddress]: nickname}];
            }
          } else if (type === FactomAddressType.EC) {
            if (addressesState.ecAddresses) {
              addressesState.ecAddresses.push({[publicAddress]: nickname});
            } else {
              addressesState.ecAddresses = [{[publicAddress]: nickname}];
            }
          }

          chrome.storage.sync.set(addressesState);       
        });

        return new ResultModel(true, `${type} address was successfully imported`);
      } catch {
        return new ResultModel(false, 'Incorrect vault password');
      }
    });
  }

  updateFactomAddressNickname(publicAddress: string, type: FactomAddressType, nickname: string) {
    const state = this.localStorageStore.getState();
    const factomAddressesPublicInfo = JSON.parse(state.factomAddressesPublicInfo);

    if (factomAddressesPublicInfo[type][publicAddress]) {
      factomAddressesPublicInfo[type][publicAddress] = nickname;
    }

    chrome.storage.sync.get(['fctAddresses', 'ecAddresses'], function(addressesState) {
      if (type === FactomAddressType.FCT) {
        addressesState.fctAddresses = addressesState.fctAddresses.filter(addressObj => Object.keys(addressObj)[0] !== publicAddress);
        addressesState.fctAddresses.push({[publicAddress]: nickname});
      } else if (type === FactomAddressType.EC) {
        addressesState.ecAddresses = addressesState.ecAddresses.filter(addressObj => Object.keys(addressObj)[0] !== publicAddress);
        addressesState.ecAddresses.push({[publicAddress]: nickname});
      }

      chrome.storage.sync.set(addressesState);       
    });

    const newState = Object.assign({}, state, {
      factomAddressesPublicInfo: JSON.stringify(factomAddressesPublicInfo)
    });

    this.localStorageStore.putState(newState);
  }

  removeFactomAddress(publicAddress: string, type: FactomAddressType, vaultPassword: string) {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);

        if (decryptedVault[publicAddress]) {
          delete decryptedVault[publicAddress];
        }
        
        const encryptedVault = await encryptor.encrypt(vaultPassword, decryptedVault);

        const factomAddressesPublicInfo = JSON.parse(state.factomAddressesPublicInfo);
        if (factomAddressesPublicInfo[type][publicAddress]) {
          delete factomAddressesPublicInfo[type][publicAddress];
        }

        const newState = Object.assign({}, state, {
          vault: encryptedVault,
          factomAddressesPublicInfo: JSON.stringify(factomAddressesPublicInfo)
        });

        this.localStorageStore.putState(newState);

        chrome.storage.sync.get(['fctAddresses', 'ecAddresses'], function(addressesState) {
          if (type === FactomAddressType.FCT) {
            addressesState.fctAddresses = addressesState.fctAddresses.filter(addressObj => Object.keys(addressObj)[0] !== publicAddress);
          } else if (type === FactomAddressType.EC) {
            addressesState.ecAddresses = addressesState.ecAddresses.filter(addressObj => Object.keys(addressObj)[0] !== publicAddress);
          }

          chrome.storage.sync.set(addressesState);       
        });

        return new ResultModel(true, `${type} address was successfully removed`);
      } catch {
        return new ResultModel(false, 'Incorrect vault password');
      }
    });
  }

  getEncryptedState(vaultPassword: string): Observable<BackupResultModel> {
    return defer(async () => {
      const decryptResult = await this.canDecryptVault(vaultPassword).toPromise();
      if (!decryptResult.success) {
        return new BackupResultModel(false, decryptResult.message);
      }

      const state = this.localStorageStore.getState();
      const backup = await encryptor.encrypt(vaultPassword, state);

      return new BackupResultModel(true, 'Successful vault backup', backup);
    });
  }

  getPrivateAddress(publicAddress: string, vaultPassword: string) {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);

        return new ResultModel(true, decryptedVault[publicAddress]);
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

  getFCTAddressesPublicInfo() {
    return JSON.parse(this.localStorageStore.getState().factomAddressesPublicInfo)[FactomAddressType.FCT];
  }

  getECAddressesPublicInfo() {
    return JSON.parse(this.localStorageStore.getState().factomAddressesPublicInfo)[FactomAddressType.EC];
  }

  anyDIDsOrAddresses(): boolean {
    return this.getDIDsCount() > 0
      || Object.keys(this.getFCTAddressesPublicInfo()).length > 0
      || Object.keys(this.getECAddressesPublicInfo()).length > 0;
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
        for (const managementKey of managementKeys) {
          if (!managementKey.privateKey) {
            managementKey.privateKey = managementKeysVaultDict[managementKey.alias];
          }
        }

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
        for (const didKey of didKeys) {
          if (!didKey.privateKey) {
            didKey.privateKey = didKeysVaultDict[didKey.alias];
          }
        }

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

  private isValidState(state: any): boolean {
    if (state.version == environment.localStorageVersion
      && state.vault
      && state.didsPublicInfo
      && state.factomAddressesPublicInfo
      && state.createdDIDsCount >= 0
      && state.createdFCTAddressesCount >= 0
      && state.createdECAddressesCount >= 0
      && state.signedRequestsCount >= 0
      && state.signedRequestsData) {
        return true;
      }

    return false;
  }
}