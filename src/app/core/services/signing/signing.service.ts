import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import * as encryptor from 'browser-passworder';
import * as nacl from 'tweetnacl/nacl-fast';
import * as naclUtil from 'tweetnacl-util';
import { Buffer } from 'buffer/';
import { defer, Observable } from 'rxjs';
import { Injectable, Output, EventEmitter } from '@angular/core';

import { SignatureDataModel } from '../../models/SignatureDataModel';
import { SignatureType } from '../../enums/signature-type';
import { VaultService } from '../vault/vault.service';

@Injectable()
export class SigningService {
  private pendingRequestsCount: number;
  @Output() change: EventEmitter<number> = new EventEmitter();

  constructor(private vaultService: VaultService) { }

  signData(data: string, publicKey: string, vaultPassword: string): Observable<SignatureDataModel> {
    return defer(async () => {
      try {
        const vault = this.vaultService.getVault();
        const decryptedVault = JSON.parse(await encryptor.decrypt(vaultPassword, vault));
        const privateKey = decryptedVault[publicKey].privateKey;
        const keyType = decryptedVault[publicKey].type;
        const dataToSign = Buffer.from(data, 'utf8');
        const signature = this.getSignature(dataToSign, keyType, privateKey);

        return new SignatureDataModel(data, keyType, publicKey, signature);
      } catch {
        return undefined;
      }
    });
  }

  updatePendingRequestsCount(pendingRequestsCount: number) {
    this.pendingRequestsCount = pendingRequestsCount;
    this.change.emit(this.pendingRequestsCount);
  }

  private getSignature(dataToSign: Buffer, type: SignatureType, privateKey: string): string {
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
    }
  }
}
