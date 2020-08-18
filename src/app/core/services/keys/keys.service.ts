declare const Buffer;
import * as nacl from 'tweetnacl/nacl-fast';
import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';

import * as createDIDActions from '../../store/create-did/create-did.actions';
import { AppState } from '../../store/app.state';
import { DidKeyModel } from '../../models/did-key.model';
import { DIDService } from '../did/did.service';
import { exportPemKeys } from '../../utils/helpers';
import { KeyPairModel } from '../../models/key-pair.model';
import { ManagementKeyModel } from '../../models/management-key.model';
import { PurposeType } from '../../enums/purpose-type';
import { SignatureType } from '../../enums/signature-type';

@Injectable()
export class KeysService {

  constructor(
    private didService: DIDService,
    private store: Store<AppState>) {
  } 

  generateKeyPair(type: SignatureType): Observable<KeyPairModel> {
    return defer(async () => {
      if (type === SignatureType.EdDSA) {
        return this.generateEdDSAKeyPair();
      } else if (type === SignatureType.ECDSA) {
        return this.generateECDSAKeyPair();
      } else if (type === SignatureType.RSA) {
        return await this.generateRSAKeyPair();
      }
    });
  }

  autoGenerateKeys(): void {
    let keyPair = this.generateEdDSAKeyPair();
    const managementKeyAlias = 'default-management-key';
    const managementKeyPriority = 0;
    const managementKey = new ManagementKeyModel(
      managementKeyAlias,
      managementKeyPriority,
      SignatureType.EdDSA,
      this.didService.getId(),
      keyPair.publicKey,
      keyPair.privateKey
    );

    this.store.dispatch(new createDIDActions.AddManagementKey(managementKey));

    keyPair = this.generateEdDSAKeyPair();
    const didKeyAlias = 'default-public-key';
    const didKey = new DidKeyModel(
      didKeyAlias,
      [PurposeType.PublicKey],
      SignatureType.EdDSA,
      this.didService.getId(),
      keyPair.publicKey,
      keyPair.privateKey
    );

    this.store.dispatch(new createDIDActions.AddDIDKey(didKey));
  }

  getPublicKeyFromPrivate(signatureType: SignatureType, privateKey: Buffer): string {
    if (signatureType == SignatureType.EdDSA) {
      const keyPair = nacl.sign.keyPair.fromSeed(privateKey);
      return Buffer.from(keyPair.publicKey).toString('hex');
    }
  }

  private generateEdDSAKeyPair(): KeyPairModel {
    const seed = nacl.randomBytes(32);
    const keyPair = nacl.sign.keyPair.fromSeed(seed);

    const publicKeyBase58 = base58.encode(Buffer.from(keyPair.publicKey));
    const privateKeyBase58 = base58.encode(Buffer.from(keyPair.secretKey));

    return new KeyPairModel(publicKeyBase58, privateKeyBase58);
  }

  private generateECDSAKeyPair(): KeyPairModel {
    const ec = new elliptic.ec('secp256k1');
    const key = ec.genKeyPair();

    const compressedPubPoint = key.getPublic(true, 'hex');
    const privateKey = key.getPrivate('hex');

    const publicKeyBase58 = base58.encode(Buffer.from(compressedPubPoint, 'hex'));
    const privateKeyBase58 = base58.encode(Buffer.from(privateKey, 'hex'));

    return new KeyPairModel(publicKeyBase58, privateKeyBase58);
  }

  private async generateRSAKeyPair(): Promise<KeyPairModel> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 4096,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        hash: { name: "SHA-256" }
      },
      true,
      ["sign", "verify"]);

    const exportedKeys = await exportPemKeys(keyPair);
    return new KeyPairModel(exportedKeys.publicKey, exportedKeys.privateKey);
  }
}
