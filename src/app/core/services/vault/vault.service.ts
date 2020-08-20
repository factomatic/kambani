import * as encryptor from 'browser-passworder';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import LocalStorageStore from 'obs-store/lib/localStorage';

import { BackupResultModel } from '../../models/backup-result.model';
import { convertECDSAPublicKeyToEtherLinkAddress, convertECDSAPublicKeyToEthereumAddress } from '../../utils/helpers';
import { DIDDocument } from '../../interfaces/did-document';
import { DidKeyEntryModel } from '../../interfaces/did-key-entry';
import { DidKeyModel } from '../../models/did-key.model';
import { environment } from 'src/environments/environment';
import { FactomAddressType } from '../../enums/factom-address-type';
import { KeyType } from '../../enums/key-type';
import { ManagementKeyEntryModel } from '../../interfaces/management-key-entry';
import { ManagementKeyModel } from '../../models/management-key.model';
import { RestoreResultModel } from '../../models/restore-result.model';
import { ResultModel } from '../../models/result.model';
import { ServiceEntryModel } from '../../interfaces/service-entry';
import { UpdateEntryDocument } from '../../interfaces/update-entry-document';

@Injectable()
export class VaultService {
  private localStorageStore: LocalStorageStore;
  private supportedLocalStorageVersions = ['1.0', '1.1'];
  private defaultWhitelistedDomains = ['https://factomatic.io', 'https://pegnet.exchange'];

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
          [FactomAddressType.EtherLink]: {},
          [FactomAddressType.EC]: {}
        }),
        keysPublicInfo: JSON.stringify({
          [KeyType.BlockSigningKey]: {},
        }),
        fctAddressesRequestWhitelistedDomains: JSON.stringify(this.defaultWhitelistedDomains),
        etherLinkAddressesRequestWhitelistedDomains: JSON.stringify(this.defaultWhitelistedDomains),
        ecAddressesRequestWhitelistedDomains: JSON.stringify([]),
        blockSigningKeysRequestWhitelistedDomains: JSON.stringify([]),
        createdDIDsCount: 0,
        createdFCTAddressesCount: 0,
        createdEtherLinkAddressesCount: 0,
        createdECAddressesCount: 0,
        signedRequestsCount: 0,
        signedRequestsData: JSON.stringify(new Array(7).fill(0)),
        dateOfLastShift: new Date().toDateString()
      });

      chrome.storage.local.set({
        fctAddresses: [],
        etherLinkAddresses: [],
        ecAddresses: [],
        blockSigningKeys: [],
        fctAddressesRequestWhitelistedDomains: this.defaultWhitelistedDomains,
        etherLinkAddressesRequestWhitelistedDomains: this.defaultWhitelistedDomains,
        ecAddressesRequestWhitelistedDomains: [],
        blockSigningKeysRequestWhitelistedDomains: []
      })
    });
  }

  upgradeStorageVersion(): boolean {
    const state = this.localStorageStore.getState();
    if (state.version !== environment.localStorageVersion) {
      const upgradedState = this.upgradeLocalStorageVersion(state);
      this.localStorageStore.putState(upgradedState);
      this.setChromeStorageState();

      return true;
    }

    return false;
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

  restoreVault(encryptedState: string, vaultPassword: string): Observable<RestoreResultModel> {
    return defer(async () => {
      try {
        let decryptedState = await encryptor.decrypt(vaultPassword, encryptedState);
        if (this.isValidState(decryptedState)) {
          let versionUpgraded = false;
          let restoreMessage = 'Vault successfully restored';

          if (decryptedState.version !== environment.localStorageVersion) {
            decryptedState = this.upgradeLocalStorageVersion(decryptedState);
            versionUpgraded = true;
            restoreMessage = undefined;
          }

          this.localStorageStore.putState(decryptedState);
          this.setChromeStorageState();
          this.updateSignedRequestsData();

          return new RestoreResultModel(true, versionUpgraded, restoreMessage);
        }

        return new RestoreResultModel(false, false, 'Invalid vault backup');
      } catch {
        return new RestoreResultModel(false, false, 'Invalid vault password or type of vault backup');
      }
    });
  }

  removeVault(): void {
    localStorage.removeItem(environment.storageKey);
    chrome.storage.local.clear();
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

  changeVaultPassword(oldPassword: string, newPassword: string) {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(oldPassword, state.vault);
        const encryptedVault = await encryptor.encrypt(newPassword, decryptedVault);

        const newState = Object.assign({}, state, {
          vault: encryptedVault
        });

        this.localStorageStore.putState(newState);

        return new ResultModel(true, 'Password was changed successfully');
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
        let etherLinkAddressesCount = state.createdEtherLinkAddressesCount;
        let ecAddressesCount = state.createdECAddressesCount;
        if (!nickname) {
          nickname = (function(addressType) {
            switch(addressType) {
              case FactomAddressType.FCT:
                return `fct-address-${++fctAddressesCount}`;
              case FactomAddressType.EtherLink:
                return `etherlink-address-${++etherLinkAddressesCount}`;
              case FactomAddressType.EC:
                return `ec-address-${++ecAddressesCount}`;
            }
          })(type)
        }

        const factomAddressesPublicInfo = JSON.parse(state.factomAddressesPublicInfo);
        factomAddressesPublicInfo[type] = Object.assign({}, factomAddressesPublicInfo[type], {
          [publicAddress]: nickname
        });

        const newState = Object.assign({}, state, {
          vault: encryptedVault,
          factomAddressesPublicInfo: JSON.stringify(factomAddressesPublicInfo),
          createdFCTAddressesCount: fctAddressesCount,
          createdEtherLinkAddressesCount: etherLinkAddressesCount,
          createdECAddressesCount: ecAddressesCount
        });

        this.localStorageStore.putState(newState);

        chrome.storage.local.get(['fctAddresses', 'etherLinkAddresses', 'ecAddresses'], function(addressesState) {
          if (type === FactomAddressType.FCT) {
            if (addressesState.fctAddresses) {
              addressesState.fctAddresses = addressesState.fctAddresses.filter(addressObj => Object.keys(addressObj)[0] !== publicAddress);
              addressesState.fctAddresses.push({[publicAddress]: nickname});
            } else {
              addressesState.fctAddresses = [{[publicAddress]: nickname}];
            }
          } else if (type === FactomAddressType.EtherLink) {
            const etherLinkAddress = convertECDSAPublicKeyToEtherLinkAddress(publicAddress);
            const ethereumAddress = convertECDSAPublicKeyToEthereumAddress(publicAddress);

            if (addressesState.etherLinkAddresses) {
              addressesState.etherLinkAddresses = addressesState.etherLinkAddresses.filter(addressObj => addressObj.etherLinkAddress !== etherLinkAddress);
              addressesState.etherLinkAddresses.push({etherLinkAddress, ethereumAddress, nickname});
            } else {
              addressesState.etherLinkAddresses = [{etherLinkAddress, ethereumAddress, nickname}];
            }
          } else if (type === FactomAddressType.EC) {
            if (addressesState.ecAddresses) {
              addressesState.ecAddresses = addressesState.ecAddresses.filter(addressObj => Object.keys(addressObj)[0] !== publicAddress);
              addressesState.ecAddresses.push({[publicAddress]: nickname});
            } else {
              addressesState.ecAddresses = [{[publicAddress]: nickname}];
            }
          }

          chrome.storage.local.set(addressesState);       
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

    chrome.storage.local.get(['fctAddresses', 'etherLinkAddresses', 'ecAddresses'], function(addressesState) {
      if (type === FactomAddressType.FCT) {
        let fctAddressesObj = addressesState.fctAddresses.find(addressObj => Object.keys(addressObj)[0] === publicAddress);
        fctAddressesObj[publicAddress] = nickname;
      } else if (type === FactomAddressType.EtherLink) {
        const etherLinkAddress = convertECDSAPublicKeyToEtherLinkAddress(publicAddress);
        let etherLinkAddressObj = addressesState.etherLinkAddresses.find(addressObj => addressObj.etherLinkAddress === etherLinkAddress);
        etherLinkAddressObj.nickname = nickname;
      } else if (type === FactomAddressType.EC) {
        let ecAddressesObj = addressesState.ecAddresses.find(addressObj => Object.keys(addressObj)[0] === publicAddress);
        ecAddressesObj[publicAddress] = nickname;
      }

      chrome.storage.local.set(addressesState);
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

        chrome.storage.local.get(['fctAddresses', 'etherLinkAddresses', 'ecAddresses'], function(addressesState) {
          if (type === FactomAddressType.FCT) {
            addressesState.fctAddresses = addressesState.fctAddresses.filter(addressObj => Object.keys(addressObj)[0] !== publicAddress);
          } else if (type === FactomAddressType.EtherLink) {
            const etherLinkAddress = convertECDSAPublicKeyToEtherLinkAddress(publicAddress);
            addressesState.etherLinkAddresses = addressesState.etherLinkAddresses.filter(addressObj => addressObj.etherLinkAddress !== etherLinkAddress);
          } else if (type === FactomAddressType.EC) {
            addressesState.ecAddresses = addressesState.ecAddresses.filter(addressObj => Object.keys(addressObj)[0] !== publicAddress);
          }

          chrome.storage.local.set(addressesState);       
        });

        return new ResultModel(true, `${type} address was successfully removed`);
      } catch {
        return new ResultModel(false, 'Incorrect vault password');
      }
    });
  }

  importKey(type: KeyType, publicKey: string, privateKey: string, vaultPassword: string, nickname: string) {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);

        decryptedVault[publicKey] = privateKey;
        const encryptedVault = await encryptor.encrypt(vaultPassword, decryptedVault);

        const keysPublicInfo = JSON.parse(state.keysPublicInfo);
        keysPublicInfo[type] = Object.assign({}, keysPublicInfo[type], {
          [publicKey]: nickname
        });

        const newState = Object.assign({}, state, {
          vault: encryptedVault,
          keysPublicInfo: JSON.stringify(keysPublicInfo)
        });

        this.localStorageStore.putState(newState);

        chrome.storage.local.get(['blockSigningKeys'], function(state) {
          if (state.blockSigningKeys) {
            state.blockSigningKeys = state.blockSigningKeys.filter(keyObj => Object.keys(keyObj)[0] !== publicKey);
            state.blockSigningKeys.push({[publicKey]: nickname});
          } else {
            state.blockSigningKeys = [{[publicKey]: nickname}];
          }

          chrome.storage.local.set(state);
        });

        return new ResultModel(true, 'Key was successfully imported');
      } catch {
        return new ResultModel(false, 'Incorrect vault password');
      }
    });
  }

  updateKeyNickname(type: KeyType, publicKey: string, nickname: string) {
    const state = this.localStorageStore.getState();
    const keysPublicInfo = JSON.parse(state.keysPublicInfo);

    if (keysPublicInfo[type][publicKey]) {
      keysPublicInfo[type][publicKey] = nickname;
    }

    const newState = Object.assign({}, state, {
      keysPublicInfo: JSON.stringify(keysPublicInfo)
    });

    this.localStorageStore.putState(newState);

    chrome.storage.local.get(['blockSigningKeys'], function(state) {
      let blockSigningKeyObj = state.blockSigningKeys.find(keyObj => Object.keys(keyObj)[0] === publicKey);
      blockSigningKeyObj[publicKey] = nickname;

      chrome.storage.local.set(state);
    });
  }

  removeKey(type: KeyType, publicKey: string, vaultPassword: string) {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);

        if (decryptedVault[publicKey]) {
          delete decryptedVault[publicKey];
        }
        
        const encryptedVault = await encryptor.encrypt(vaultPassword, decryptedVault);

        const keysPublicInfo = JSON.parse(state.keysPublicInfo);
        if (keysPublicInfo[type][publicKey]) {
          delete keysPublicInfo[type][publicKey];
        }

        const newState = Object.assign({}, state, {
          vault: encryptedVault,
          keysPublicInfo: JSON.stringify(keysPublicInfo)
        });

        this.localStorageStore.putState(newState);

        chrome.storage.local.get(['blockSigningKeys'], function(state) {
          state.blockSigningKeys = state.blockSigningKeys.filter(keyObj => Object.keys(keyObj)[0] !== publicKey);
    
          chrome.storage.local.set(state);
        });

        return new ResultModel(true, 'Key was successfully removed');
      } catch {
        return new ResultModel(false, 'Incorrect vault password');
      }
    });
  }

  addWhitelistedDomain(requestType: string, domain: string) {
    this.syncWhitelistedDomains(requestType, domain);
  }

  removeWhitelistedDomain(requestType: string, domain: string) {
    this.syncWhitelistedDomains(requestType, domain, true);
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

  getPrivateKeyOrAddress(publicKeyOrAddress: string, vaultPassword: string) {
    return defer(async () => {
      try {
        const state = this.localStorageStore.getState();
        const decryptedVault = await encryptor.decrypt(vaultPassword, state.vault);

        return new ResultModel(true, decryptedVault[publicKeyOrAddress]);
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

  getEtherLinkAddressesPublicInfo() {
    return JSON.parse(this.localStorageStore.getState().factomAddressesPublicInfo)[FactomAddressType.EtherLink];
  }

  getECAddressesPublicInfo() {
    return JSON.parse(this.localStorageStore.getState().factomAddressesPublicInfo)[FactomAddressType.EC];
  }

  getBlockSigningKeysPublicInfo() {
    return JSON.parse(this.localStorageStore.getState().keysPublicInfo)[KeyType.BlockSigningKey];
  }

  getFCTAddressesRequestWhitelistedDomains() {
    return JSON.parse(this.localStorageStore.getState().fctAddressesRequestWhitelistedDomains);
  }

  getEtherLinkAddressesRequestWhitelistedDomains() {
    return JSON.parse(this.localStorageStore.getState().etherLinkAddressesRequestWhitelistedDomains);
  }

  getECAddressesRequestWhitelistedDomains() {
    return JSON.parse(this.localStorageStore.getState().ecAddressesRequestWhitelistedDomains);
  }

  getBlockSigningKeysRequestWhitelistedDomains() {
    return JSON.parse(this.localStorageStore.getState().blockSigningKeysRequestWhitelistedDomains);
  }

  anyDIDsOrAddresses(): boolean {
    return this.getDIDsCount() > 0
      || Object.keys(this.getBlockSigningKeysPublicInfo()).length > 0
      || Object.keys(this.getFCTAddressesPublicInfo()).length > 0
      || Object.keys(this.getEtherLinkAddressesPublicInfo()).length > 0
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
    if ((this.supportedLocalStorageVersions.includes(state.version))
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

  private upgradeLocalStorageVersion(state: any) {
    switch(state.version) {
      case '1.0':
        return this.upgradeStorageToVersion_1_1(state);
      default:
        break;
    }
  }

  private upgradeStorageToVersion_1_1(state: any) {
    const addressesPublicInfo = Object.assign({},
      JSON.parse(state['factomAddressesPublicInfo']),
      {[FactomAddressType.EtherLink]: {}})

    return Object.assign({},
      state,
      {
        version: environment.localStorageVersion,
        createdEtherLinkAddressesCount: 0,
        fctAddressesRequestWhitelistedDomains: JSON.stringify(this.defaultWhitelistedDomains),
        etherLinkAddressesRequestWhitelistedDomains: JSON.stringify(this.defaultWhitelistedDomains),
        ecAddressesRequestWhitelistedDomains: JSON.stringify([]),
        blockSigningKeysRequestWhitelistedDomains: JSON.stringify([]),
        keysPublicInfo: JSON.stringify({[KeyType.BlockSigningKey]: {}}),
        factomAddressesPublicInfo: JSON.stringify(addressesPublicInfo)
      }
    );
  }

  private setChromeStorageState() {
    const fctAddressesRequestWhitelistedDomains = this.getFCTAddressesRequestWhitelistedDomains();
    const etherLinkAddressesRequestWhitelistedDomains = this.getEtherLinkAddressesRequestWhitelistedDomains();
    const ecAddressesRequestWhitelistedDomains = this.getECAddressesRequestWhitelistedDomains();
    const blockSigningKeysRequestWhitelistedDomains = this.getBlockSigningKeysRequestWhitelistedDomains();
    const fctAddressesPublicInfo = this.getFCTAddressesPublicInfo();
    const etherLinkAddressesPublicInfo = this.getEtherLinkAddressesPublicInfo();
    const ecAddressesPublicInfo = this.getECAddressesPublicInfo();
    const blockSigningKeysPublicInfo = this.getBlockSigningKeysPublicInfo();

    let fctAddresses = [];
    let etherLinkAddresses = [];
    let ecAddresses = [];
    let blockSigningKeys = [];

    for (const fctPublicAddress of Object.keys(fctAddressesPublicInfo)) {
      fctAddresses.push({[fctPublicAddress]: fctAddressesPublicInfo[fctPublicAddress]});
    }

    for (const etherLinkPublicAddress of Object.keys(etherLinkAddressesPublicInfo)) {
      const etherLinkAddress = convertECDSAPublicKeyToEtherLinkAddress(etherLinkPublicAddress);
      const ethereumAddress = convertECDSAPublicKeyToEthereumAddress(etherLinkPublicAddress);
      const nickname = etherLinkAddressesPublicInfo[etherLinkPublicAddress];

      etherLinkAddresses.push({etherLinkAddress, ethereumAddress, nickname});
    }

    for (const ecPublicAddress of Object.keys(ecAddressesPublicInfo)) {
      ecAddresses.push({[ecPublicAddress]: ecAddressesPublicInfo[ecPublicAddress]});
    }

    for (const publicKey of Object.keys(blockSigningKeysPublicInfo)) {
      blockSigningKeys.push({[publicKey]: blockSigningKeysPublicInfo[publicKey]});
    }

    chrome.storage.local.set({
      fctAddressesRequestWhitelistedDomains,
      etherLinkAddressesRequestWhitelistedDomains,
      ecAddressesRequestWhitelistedDomains,
      blockSigningKeysRequestWhitelistedDomains,
      fctAddresses,
      etherLinkAddresses,
      ecAddresses,
      blockSigningKeys
    });
  }

  private syncWhitelistedDomains(requestType: string, domain: string, isRemoveAction: boolean = false) {
    const state = this.localStorageStore.getState();
    const whitelistedDomainsKey = (function(requestType) {
      switch(requestType) {
        case FactomAddressType.FCT:
          return 'fctAddressesRequestWhitelistedDomains';
        case FactomAddressType.EtherLink:
          return 'etherLinkAddressesRequestWhitelistedDomains';
        case FactomAddressType.EC:
          return 'ecAddressesRequestWhitelistedDomains';
        case KeyType.BlockSigningKey:
          return 'blockSigningKeysRequestWhitelistedDomains';
      }
    })(requestType)

    let whitelistedDomains = JSON.parse(state[whitelistedDomainsKey]);
    if (isRemoveAction) {
      whitelistedDomains = whitelistedDomains.filter(d => d !== domain);
    } else if (!whitelistedDomains.includes(domain)) {
      whitelistedDomains.push(domain);
    }

    chrome.storage.local.get([whitelistedDomainsKey], function(state) {
      state[whitelistedDomainsKey] = whitelistedDomains;
      chrome.storage.local.set(state);
    });

    const newState = Object.assign({}, state, {
      [whitelistedDomainsKey]: JSON.stringify(whitelistedDomains)
    });

    this.localStorageStore.putState(newState);
  }
}
