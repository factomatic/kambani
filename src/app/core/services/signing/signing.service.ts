declare const Buffer;
import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import * as encryptor from 'browser-passworder';
import * as nacl from 'tweetnacl/nacl-fast';
import * as naclUtil from 'tweetnacl-util';
import { addressToKey } from 'factom';
import { defer, Observable } from 'rxjs';
import { Injectable, Output, EventEmitter } from '@angular/core';
import { sha256 } from 'js-sha256';

import { convertPemToBinary, calculateDoubleSha256 } from '../../utils/helpers';
import { DIDDocument } from '../../interfaces/did-document';
import { DidKeyEntryModel } from '../../interfaces/did-key-entry';
import { EntryType } from '../../enums/entry-type';
import { environment } from 'src/environments/environment';
import { ManagementKeyEntryModel } from '../../interfaces/management-key-entry';
import { RequestKeyType } from '../../enums/request-key-type';
import { RevokeModel } from '../../interfaces/revoke-model';
import { ServiceEntryModel } from '../../interfaces/service-entry';
import { SignatureDataModel } from '../../models/signature-data.model';
import { SignatureResultModel } from '../../models/signature-result.model';
import { SignatureType } from '../../enums/signature-type';
import { UpdateEntryDocument } from '../../interfaces/update-entry-document';
import { VaultService } from '../vault/vault.service';

const RSA_SIGNING_ALGO_NAME = "RSASSA-PKCS1-v1_5";

@Injectable()
export class SigningService {
  private entrySchemaVersion = environment.entrySchemaVersion;
  private pendingRequestsCount: number;
  @Output() change: EventEmitter<number> = new EventEmitter();

  constructor(private vaultService: VaultService) { }

  signData(data: string, requestKeyType: string, signingKeyOrAddress: any, vaultPassword: string): Observable<SignatureDataModel> {
    return defer(async () => {
      try {
        const vault = this.vaultService.getVault();
        const decryptedVault = await encryptor.decrypt(vaultPassword, vault);
        const dataToSign = Buffer.from(sha256.update(data).digest());
        let signatureType;
        let publicKey;
        let signature;

        if (requestKeyType == RequestKeyType.DIDKey || requestKeyType == RequestKeyType.ManagementKey) {
          const signingKeyIdParts = signingKeyOrAddress.id.split('#');
          const didId = signingKeyIdParts[0];
          const signingKeyAlias = signingKeyIdParts[1];
          const keys = requestKeyType == RequestKeyType.DIDKey
            ? decryptedVault[didId].didKeys
            : decryptedVault[didId].managementKeys;

          const privateKey = keys[signingKeyAlias];
          publicKey = signingKeyOrAddress.publicKeyBase58
            ? Buffer.from(base58.decode(signingKeyOrAddress.publicKeyBase58))
            : Buffer.from(convertPemToBinary(signingKeyOrAddress.publicKeyPem));

          signatureType = signingKeyOrAddress.type.replace('VerificationKey', '') as SignatureType;
          signature = Buffer.from(await this.getSignature(dataToSign, signatureType, privateKey));

          if (signatureType == SignatureType.RSA) {
            signatureType = RSA_SIGNING_ALGO_NAME;
          }

        } else if (requestKeyType == RequestKeyType.EtherLink) {
            const curve = elliptic.ec('secp256k1');
            const keyPair = curve.keyFromPrivate(decryptedVault[signingKeyOrAddress]);
            publicKey = Buffer.concat([Buffer.from('04', 'hex'), Buffer.from(keyPair.getPublic('buffer'))]);
            signatureType = SignatureType.ECDSA;
            signature = keyPair.sign(dataToSign).toDER();   
        } else {
          // This is a signature with an FCT, EC or BlockSigning key.
          let privateKey;
          if (requestKeyType == RequestKeyType.FCT || requestKeyType == RequestKeyType.EC) {
            privateKey = addressToKey(decryptedVault[signingKeyOrAddress]);
          } else {
            privateKey = Buffer.from(decryptedVault[signingKeyOrAddress], 'hex');
          }

          const keyPair = nacl.sign.keyPair.fromSeed(privateKey);
          publicKey = Buffer.from(keyPair.publicKey);
          signatureType = SignatureType.EdDSA;
          signature = Buffer.from(nacl.sign.detached(dataToSign, keyPair.secretKey));
        }

        this.vaultService.incrementSignedRequests();

        return new SignatureDataModel(
          dataToSign,
          publicKey,
          signature,
          signatureType
        );
      } catch {
        return undefined;
      }
    });
  }

  signPegNetTransaction(data: Buffer, publicAddress: string, vaultPassword: string): Observable<SignatureDataModel> {
    return defer(async () => {
      try {
        const vault = this.vaultService.getVault();
        const decryptedVault = await encryptor.decrypt(vaultPassword, vault);
        let privateKey;
        let signatureType;
        let publicKey;
        let signature;

        if (publicAddress.startsWith('FA')) {
          privateKey = addressToKey(decryptedVault[publicAddress]);
          const keyPair = nacl.sign.keyPair.fromSeed(privateKey);
          publicKey = Buffer.from(keyPair.publicKey);
          signatureType = SignatureType.EdDSA;
          signature = Buffer.from(nacl.sign.detached(data, keyPair.secretKey));
        } else {
          const curve = elliptic.ec('secp256k1');
          const keyPair = curve.keyFromPrivate(decryptedVault[publicAddress]);
          publicKey = Buffer.concat([Buffer.from('04', 'hex'), Buffer.from(keyPair.getPublic('buffer'))]);
          signatureType = SignatureType.ECDSA;
          signature = keyPair.sign(data).toDER();
        }

        this.vaultService.incrementSignedRequests();

        return new SignatureDataModel(
          data,
          publicKey,
          signature,
          signatureType
        );
      } catch {
        return undefined;
      }
    });
  }

  signDIDEntry(fullDIDId: string, signatureType: SignatureType, entry: any, entryType: EntryType, vaultPassword: string): Observable<SignatureResultModel> {
    return defer(async () => {
      try {
        const vault = this.vaultService.getVault();
        const decryptedVault = await encryptor.decrypt(vaultPassword, vault);

        const fullDIDIdParts = fullDIDId.split('#');
        const didId = fullDIDIdParts[0];
        const keyAlias = fullDIDIdParts[1];

        const managementKeys = decryptedVault[didId].managementKeys;
        const privateKey = managementKeys[keyAlias];

        let contentToSign;
        if (entryType == EntryType.DeactivateDIDEntry) {
          contentToSign = Buffer.from(calculateDoubleSha256(
            entryType.concat(this.entrySchemaVersion, fullDIDId)
          ));
        } else {
          contentToSign = Buffer.from(calculateDoubleSha256(
            entryType.concat(this.entrySchemaVersion, fullDIDId, JSON.stringify(entry))
          ));
        }

        const signature = await this.getSignature(contentToSign, signatureType, privateKey);   
        const signatureBase64 = naclUtil.encodeBase64(signature);

        return new SignatureResultModel(true, 'Successfully signed the entry', signatureBase64);
      } catch {
        return new SignatureResultModel(false, 'Incorrect vault password');
      }
    });
  }

  getAvailableManagementKeysForSigning(didId: string, entry: UpdateEntryDocument): ManagementKeyEntryModel[] {
    const didDocument: DIDDocument = this.vaultService.getDIDPublicInfo(didId).didDocument;
    let requiredPriority = 101;

    if (entry.revoke) {
      const revokeObject = entry.revoke;

      if (revokeObject.managementKey) {
        const revokedManagementKeysRequiredPriority =
          this.getRevokedManagementKeysRequiredPriority(revokeObject.managementKey, didDocument.managementKey);
        if (revokedManagementKeysRequiredPriority < requiredPriority) {
          requiredPriority = revokedManagementKeysRequiredPriority;
        }
      }

      if (revokeObject.didKey) {
        const revokedDidKeysRequiredPriority = this.getRevokedDidKeysRequiredPriority(revokeObject.didKey, didDocument.didKey);
        if (revokedDidKeysRequiredPriority < requiredPriority) {
          requiredPriority = revokedDidKeysRequiredPriority;
        }
      }

      if (revokeObject.service) {
        const revokedServicesRequiredPriority = this.getRevokedServicesRequiredPriority(revokeObject.service, didDocument.service);
        if (revokedServicesRequiredPriority < requiredPriority) {
          requiredPriority = revokedServicesRequiredPriority;
        }
      }
    }

    if (entry.add && entry.add.managementKey) {
      const addedManagementKeysRequiredPriority = this.getAddedManagementKeysRequiredPriority(entry.add.managementKey);
      if (addedManagementKeysRequiredPriority < requiredPriority) {
        requiredPriority = addedManagementKeysRequiredPriority;
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

      if (managementKey.priorityRequirement != undefined) {
        if (managementKey.priorityRequirement < requiredPriority) {
          requiredPriority = managementKey.priorityRequirement;
        }
      } else {
        if (managementKey.priority < requiredPriority) {
          requiredPriority = managementKey.priority;
        }
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
    }

    return requiredPriority;
  }

  private async getSignature(dataToSign: Buffer, type: SignatureType, privateKey: string): Promise<any> {
    if (type === SignatureType.EdDSA) {
      const secret = Buffer.from(base58.decode(privateKey));
      const keyPair = nacl.sign.keyPair.fromSecretKey(secret);

      return nacl.sign.detached(dataToSign, keyPair.secretKey);
    } else if (type === SignatureType.ECDSA) {
      const ec = elliptic.ec('secp256k1');
      const key = ec.keyFromPrivate(base58.decode(privateKey), 'hex');
      const signature = key.sign(dataToSign);

      return signature.toDER();
    } else if (type == SignatureType.RSA) {
      const signAlgorithm = {
        name: RSA_SIGNING_ALGO_NAME,
        modulusLength: 4096,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: { name: "SHA-256" }
      };

      const privateCryptoKey = await window.crypto.subtle.importKey("pkcs8", convertPemToBinary(privateKey) as ArrayBuffer, signAlgorithm, true, ["sign"]);
      const signature = await window.crypto.subtle.sign(signAlgorithm, privateCryptoKey, dataToSign);

      return new Uint8Array(signature);
    }
  }
}
