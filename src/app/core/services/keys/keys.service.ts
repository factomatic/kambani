import * as base58 from 'bs58';
import * as encryptor from 'browser-passworder';
import * as nacl from 'tweetnacl/nacl-fast';
import { Buffer } from 'buffer/';
import { defer, Observable } from 'rxjs';
import { Injectable } from '@angular/core';

import { ImportResultModel } from '../../models/ImportResultModel';
import { KeyPairModel } from '../../models/KeyPairModel';
import { VaultService } from '../vault/vault.service';

@Injectable()
export class KeysService {

  constructor(private vaultService: VaultService) { }

  importFromJsonFile(file: string, filePassword: string, vaultPassword: string): Observable<ImportResultModel> {
    return defer(async() => {
      try {
        const decryptedFileJson = await encryptor.decrypt(filePassword, file);
        const decryptedFile = JSON.parse(decryptedFileJson);
        const keyPairs: KeyPairModel[] = [];

        if (Array.isArray(decryptedFile) && decryptedFile.length > 0) {
          for (const privateKey of decryptedFile) {
            const keyPair = nacl.sign.keyPair.fromSecretKey(base58.decode(privateKey));
            const publicKey = base58.encode(Buffer.from(keyPair.publicKey));

            keyPairs.push(new KeyPairModel(publicKey, privateKey));
          }

          return await this.vaultService.importKeys(keyPairs, vaultPassword);
        } else {
          return new ImportResultModel(false, 'Invalid type of keystore');
        }
      } catch {
        return new ImportResultModel(false, 'Invalid file password or type of keystore');
      }
    });
  }

  importFromPrivateKey(privateKey: string, vaultPassword: string): Observable<ImportResultModel> {
    return defer(async () => {
      try {
        const keyPair = nacl.sign.keyPair.fromSecretKey(base58.decode(privateKey));
        const publicKey = base58.encode(Buffer.from(keyPair.publicKey));

        const keyPairs = [new KeyPairModel(publicKey, privateKey)];

        return await this.vaultService.importKeys(keyPairs, vaultPassword);
      } catch {
        return new ImportResultModel(false, 'Invalid private key');
      }
    });
  }
}
