import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import * as encryptor from 'browser-passworder';
import * as nacl from 'tweetnacl/nacl-fast';
import * as naclUtil from 'tweetnacl-util';
import { Buffer } from 'buffer/';
import { defer, Observable } from 'rxjs';
import { Injectable, Output, EventEmitter } from '@angular/core';

import { arrayBufferToBase64String, convertPemToBinary, calculateDoubleSha256 } from '../../utils/helpers';
import { EntryType } from '../../enums/entry-type';
import { environment } from 'src/environments/environment';
import { ManagementKeyEntryModel } from '../../interfaces/management-key-entry';
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

  signData(data: string, publicKey: string, vaultPassword: string): Observable<SignatureDataModel> {
    return defer(async () => {
      try {
        const vault = this.vaultService.getVault();
        const decryptedVault = JSON.parse(await encryptor.decrypt(vaultPassword, vault));
        const privateKey = decryptedVault[publicKey].privateKey;
        const signatureType = decryptedVault[publicKey].type;
        const dataToSign = Buffer.from(data, 'utf8');
        const signature = await this.getSignature(dataToSign, signatureType, privateKey);

        return new SignatureDataModel(data, signatureType, publicKey, signature);
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
    const didDocument = this.vaultService.getDIDDocument(didId);
    const managementKeys = didDocument.managementKey;
    let requiredPriorityObject = { value: 101 };

    if (entry.revoke) {
      const revokeObject = entry.revoke;

      if (revokeObject.managementKey) {
        for (const revokeManagementKeyObject of revokeObject.managementKey) {
          const managementKey = managementKeys.find(mk => mk.id === revokeManagementKeyObject.id);
          if (managementKey.priority < requiredPriorityObject.value) {
            requiredPriorityObject.value = managementKey.priority;
          }

          this.checkPriorityRequirement(managementKey, requiredPriorityObject);
        }
      }

      if (revokeObject.didKey) {
        const didKeys = didDocument.didKey;

        for (const revokeDidKeyObject of revokeObject.didKey) {
          const didKey = didKeys.find(dk => dk.id === revokeDidKeyObject.id);
          this.checkPriorityRequirement(didKey, requiredPriorityObject);
        }
      }

      if (revokeObject.service) {
        const services = didDocument.service;

        for (const revokeServiceObject of revokeObject.service) {
          const service = services.find(s => s.id === revokeServiceObject.id);
          this.checkPriorityRequirement(service, requiredPriorityObject);
        }
      }
    }

    if (entry.add) {
      const addObject = entry.add;

      if (addObject.managementKey) {
        for (const addManagementKeyObject of addObject.managementKey) {
          let requiredPriorityForTheKey = addManagementKeyObject.priority;

          if (requiredPriorityForTheKey > 0) {
            requiredPriorityForTheKey--;
          }
          
          if (requiredPriorityForTheKey < requiredPriorityObject.value) {
            requiredPriorityObject.value = requiredPriorityForTheKey;
          }

          this.checkPriorityRequirement(addManagementKeyObject, requiredPriorityObject);
        }
      }

      if (addObject.didKey) {
        for (const addDidKeyObject of addObject.didKey) {
          this.checkPriorityRequirement(addDidKeyObject, requiredPriorityObject);
        }
      }

      if (addObject.service) {
        for (const addServiceObject of addObject.service) {
          this.checkPriorityRequirement(addServiceObject, requiredPriorityObject);
        }
      }
    }

    return didDocument.managementKey.filter(mk => mk.priority <= requiredPriorityObject.value);
  }

  updatePendingRequestsCount(pendingRequestsCount: number) {
    this.pendingRequestsCount = pendingRequestsCount;
    this.change.emit(this.pendingRequestsCount);
  }

  private checkPriorityRequirement(object: any, requiredPriorityObject: any) {
    if (object.priorityRequirement != undefined && object.priorityRequirement < requiredPriorityObject.value) {
      requiredPriorityObject.value = object.priorityRequirement;
    }
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
