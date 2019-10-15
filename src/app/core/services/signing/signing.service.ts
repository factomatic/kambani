import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import * as encryptor from 'browser-passworder';
import * as nacl from 'tweetnacl/nacl-fast';
import * as naclUtil from 'tweetnacl-util';
import { Buffer } from 'buffer/';
import { defer, Observable } from 'rxjs';
import { Injectable, Output, EventEmitter } from '@angular/core';

import { arrayBufferToBase64String, convertPemToBinary, calculateDoubleSha256 } from '../../utils/helpers';
import { DIDDocument } from '../../interfaces/did-document';
import { DidKeyEntryModel } from '../../interfaces/did-key-entry';
import { EntryType } from '../../enums/entry-type';
import { environment } from 'src/environments/environment';
import { ManagementKeyEntryModel } from '../../interfaces/management-key-entry';
import { RevokeModel } from '../../interfaces/revoke-model';
import { ServiceEntryModel } from '../../interfaces/service-entry';
import { SignatureDataModel } from '../../models/signature-data.model';
import { SignatureResultModel } from '../../models/signature-result.model';
import { SignatureType } from '../../enums/signature-type';
import { UpdateEntryDocument } from '../../interfaces/update-entry-document';
import { VaultService } from '../vault/vault.service';

@Injectable()
export class SigningService {
  private entrySchemaVersion = environment.entrySchemaVersion;
  private pendingRequestsCount: number;
  @Output() change: EventEmitter<number> = new EventEmitter();

  constructor(private vaultService: VaultService) { }

  signData(data: string, signingKeyModel: DidKeyEntryModel, vaultPassword: string): Observable<SignatureDataModel> {
    return defer(async () => {
      try {
        const signingKeyIdParts = signingKeyModel.id.split('#');
        const didId = signingKeyIdParts[0];
        const signingKeyAlias = signingKeyIdParts[1];

        const vault = this.vaultService.getVault();
        const decryptedVault = await encryptor.decrypt(vaultPassword, vault);
        const didKeys = decryptedVault[didId].didKeys;
        const privateKey = didKeys[signingKeyAlias];
        const dataToSign = Buffer.from(data, 'utf8');
        const signatureType = signingKeyModel.type.replace('VerificationKey', '') as SignatureType;
        const signature = await this.getSignature(dataToSign, signatureType, privateKey);
        this.vaultService.updateSignedRequests();

        return new SignatureDataModel(
          data,
          signatureType,
          signingKeyModel.publicKeyBase58 ? signingKeyModel.publicKeyBase58 : signingKeyModel.publicKeyPem,
          signature);
      } catch {
        return undefined;
      }
    });
  }

  signUpdateEntry(didId: string, selectedManagementKey: ManagementKeyEntryModel, entry: UpdateEntryDocument, vaultPassword: string): Observable<SignatureResultModel> {
    return defer(async () => {
      try {
        const vault = this.vaultService.getVault();
        const decryptedVault = await encryptor.decrypt(vaultPassword, vault);
        const managementKeys = decryptedVault[didId].managementKeys;
        const privateKey = managementKeys[selectedManagementKey.id.split('#')[1]];
        const contentToSignDoubleSha256Hash = calculateDoubleSha256(EntryType.UpdateDIDEntry.concat(this.entrySchemaVersion, selectedManagementKey.id, JSON.stringify(entry)));
        const signatureBase64 = await this.getSignature(
          Buffer.from(contentToSignDoubleSha256Hash, 'utf8'),
          selectedManagementKey.type.replace('VerificationKey', '') as SignatureType,
          privateKey);

        return new SignatureResultModel(true, 'Successfully signed the entry', signatureBase64);
      } catch {
        return new SignatureResultModel(false, 'Incorrect vault password');
      }
    });
  }

  getAvailableManagementKeysForSigning(didId: string, entry: UpdateEntryDocument): ManagementKeyEntryModel[] {
    const didDocument: DIDDocument = this.vaultService.getDIDPublicInfo(didId).didDocument;
    const managementKeys = didDocument.managementKey;
    let requiredPriority = 101;

    if (entry.revoke) {
      const revokeObject = entry.revoke;

      if (revokeObject.managementKey) {
        const revokedManagementKeysRequiredPriority = this.getRevokedManagementKeysRequiredPriority(revokeObject.managementKey, managementKeys);
        if (revokedManagementKeysRequiredPriority < requiredPriority) {
          requiredPriority = revokedManagementKeysRequiredPriority;
        }
      }

      if (revokeObject.didKey) {
        const didKeys = didDocument.didKey;
        const revokedDidKeysRequiredPriority = this.getRevokedDidKeysRequiredPriority(revokeObject.didKey, didKeys);
        if (revokedDidKeysRequiredPriority < requiredPriority) {
          requiredPriority = revokedDidKeysRequiredPriority;
        }
      }

      if (revokeObject.service) {
        const services = didDocument.service;
        const revokedServicesRequiredPriority = this.getRevokedServicesRequiredPriority(revokeObject.service, services);
        if (revokedServicesRequiredPriority < requiredPriority) {
          requiredPriority = revokedServicesRequiredPriority;
        }
      }
    }

    if (entry.add) {
      const addObject = entry.add;

      if (addObject.managementKey) {
        const addedManagementKeysRequiredPriority = this.getAddedManagementKeysRequiredPriority(addObject.managementKey);
        if (addedManagementKeysRequiredPriority < requiredPriority) {
          requiredPriority = addedManagementKeysRequiredPriority;
        }
      }

      if (addObject.didKey) {
        const addedDidKeysRequiredPriority = this.getAddedDidKeysRequiredPriority(addObject.didKey);
        if (addedDidKeysRequiredPriority < requiredPriority) {
          requiredPriority = addedDidKeysRequiredPriority;
        }
      }

      if (addObject.service) {
        const addedServicesRequiredPriority = this.getAddedServicesRequiredPriority(addObject.service);
        if (addedServicesRequiredPriority < requiredPriority) {
          requiredPriority = addedServicesRequiredPriority;
        }
      }
    }

    return didDocument.managementKey.filter(mk => mk.priority <= requiredPriority);
  }

  checkIfSigningKeyNeedsToBeRevoked(selectedManagementKey: ManagementKeyEntryModel, updateEntry: UpdateEntryDocument): boolean {
    if (updateEntry.add && updateEntry.add.managementKey) {
      const addedManagementKeys = updateEntry.add.managementKey;
      if (addedManagementKeys.some(mk => mk.priority === selectedManagementKey.priority)) {
        return true;
      }
    }

    return false;
  }

  updatePendingRequestsCount(pendingRequestsCount: number) {
    this.pendingRequestsCount = pendingRequestsCount;
    this.change.emit(this.pendingRequestsCount);
  }

  private getRevokedManagementKeysRequiredPriority(revokedManagementKeys: RevokeModel[], managementKeys: ManagementKeyEntryModel[]): number {
    let requiredPriority = 101;

    for (const revokeManagementKeyObject of revokedManagementKeys) {
      const managementKey = managementKeys.find(mk => mk.id === revokeManagementKeyObject.id);
      if (managementKey.priority < requiredPriority) {
        requiredPriority = managementKey.priority;
      }

      if (managementKey.priorityRequirement != undefined && managementKey.priorityRequirement < requiredPriority) {
        requiredPriority = managementKey.priorityRequirement;
      }
    }

    return requiredPriority;
  }

  private getRevokedDidKeysRequiredPriority(revokedDidKeys: RevokeModel[], didKeys: DidKeyEntryModel[]): number {
    let requiredPriority = 101;

    for (const revokeDidKeyObject of revokedDidKeys) {
      const didKey = didKeys.find(dk => dk.id === revokeDidKeyObject.id);

      if (didKey.priorityRequirement != undefined && didKey.priorityRequirement < requiredPriority) {
        requiredPriority = didKey.priorityRequirement;
      }
    }

    return requiredPriority;
  }

  private getRevokedServicesRequiredPriority(revokedServices: RevokeModel[], services: ServiceEntryModel[]): number {
    let requiredPriority = 101;

    for (const revokeServiceObject of revokedServices) {
      const service = services.find(dk => dk.id === revokeServiceObject.id);

      if (service.priorityRequirement != undefined && service.priorityRequirement < requiredPriority) {
        requiredPriority = service.priorityRequirement;
      }
    }

    return requiredPriority;
  }

  private getAddedManagementKeysRequiredPriority(addedManagementKeys: ManagementKeyEntryModel[]): number {
    let requiredPriority = 101;

    for (const addManagementKeyObject of addedManagementKeys) {
      if (addManagementKeyObject.priority < requiredPriority) {
        requiredPriority = addManagementKeyObject.priority;
      }

      if (addManagementKeyObject.priorityRequirement != undefined && addManagementKeyObject.priorityRequirement < requiredPriority) {
        requiredPriority = addManagementKeyObject.priorityRequirement;
      }
    }

    return requiredPriority;
  }

  private getAddedDidKeysRequiredPriority(addedDidKeys: DidKeyEntryModel[]): number {
    let requiredPriority = 101;

    for (const addDidKeyObject of addedDidKeys) {
      if (addDidKeyObject.priorityRequirement != undefined && addDidKeyObject.priorityRequirement < requiredPriority) {
        requiredPriority = addDidKeyObject.priorityRequirement;
      }
    }

    return requiredPriority;
  }

  private getAddedServicesRequiredPriority(addedServices: ServiceEntryModel[]): number {
    let requiredPriority = 101;

    for (const addServiceObject of addedServices) {
      if (addServiceObject.priorityRequirement != undefined && addServiceObject.priorityRequirement < requiredPriority) {
        requiredPriority = addServiceObject.priorityRequirement;
      }
    }

    return requiredPriority;
  }

  private async getSignature(dataToSign: Buffer, type: SignatureType, privateKey: string): Promise<string> {
    if (type === SignatureType.EdDSA) {
      const secret = Buffer.from(base58.decode(privateKey));
      const keyPair = nacl.sign.keyPair.fromSecretKey(secret);

      const signature = nacl.sign.detached(dataToSign, keyPair.secretKey);
      const signatureBase64 = naclUtil.encodeBase64(signature);

      return signatureBase64;
    } else if (type === SignatureType.ECDSA) {
      const ec = elliptic.ec('secp256k1');
      const key = ec.keyFromPrivate(base58.decode(privateKey), 'hex');
      const signature = key.sign(dataToSign);

      const derSignature = signature.toDER();
      const signatureBase64 = naclUtil.encodeBase64(derSignature);

      return signatureBase64;
    } else if (type == SignatureType.RSA) {
      const signAlgorithm = {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 4096,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: { name: "SHA-256" }
      };

      const privateCryptoKey = await window.crypto.subtle.importKey("pkcs8", convertPemToBinary(privateKey) as ArrayBuffer, signAlgorithm, true, ["sign"]);
      const signature = await window.crypto.subtle.sign(signAlgorithm, privateCryptoKey, dataToSign);
      const signatureBase64 = arrayBufferToBase64String(signature);

      return signatureBase64;
    }
  }
}
