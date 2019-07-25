import * as base58 from 'bs58';
import * as elliptic from 'elliptic';
import * as encryptor from 'browser-passworder';
import * as forge from 'node-forge';
import * as nacl from 'tweetnacl/nacl-fast';
import { Buffer } from 'buffer/';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

import { ImportKeyModel } from '../../models/import-key.model';
import { ImportResultModel } from '../../models/import-result.model';
import { modifyPemPrefixAndSuffix } from '../../utils/helpers';
import { SignatureType} from '../../enums/signature-type';
import { VaultService } from '../vault/vault.service';

@Injectable()
export class KeysService {

  constructor(private vaultService: VaultService) { }

  importFromJsonFile(file: string, filePassword: string, vaultPassword: string): Observable<ImportResultModel> {
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

          return await this.vaultService.importKeys(importKeysModels, vaultPassword);
        } else {
          return new ImportResultModel(false, 'Invalid type of keystore');
        }
      } catch {
        return new ImportResultModel(false, 'Invalid file password or type of keystore');
      }
    });
  }

  importFromPrivateKey(alias: string, type: string, privateKey: string, vaultPassword: string): Observable<ImportResultModel> {
    return defer(async () => {
      try {
        const importKeyModel = this.getImportKeyModel(alias, type, privateKey);
        const importKeysModels = [importKeyModel];

        return await this.vaultService.importKeys(importKeysModels, vaultPassword);
      } catch {
        return new ImportResultModel(false, 'Invalid private key');
      }
    });
  }

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

  private extractEncryptedKeys(file: string): string {
    const parsedFile = JSON.parse(file);
    const keysFile: any = { };

    keysFile.data = parsedFile.data;
    keysFile.iv = parsedFile.encryptionAlgo.iv;
    keysFile.salt = parsedFile.encryptionAlgo.salt;

    return JSON.stringify(keysFile);
  }
}
