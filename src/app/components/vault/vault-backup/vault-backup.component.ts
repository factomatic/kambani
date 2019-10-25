import { Component, OnInit } from '@angular/core';

import { downloadFile } from 'src/app/core/utils/helpers';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-vault-backup',
  templateUrl: './vault-backup.component.html',
  styleUrls: ['./vault-backup.component.scss']
})
export class VaultBackupComponent implements OnInit {
  public anyDIDs: boolean;

  constructor(private vaultService: VaultService) { }

  ngOnInit() {
    this.anyDIDs = this.vaultService.anyDIDs();
  }

  backupVault() {
    const vault = this.postProcessEncryptedVaultFile(this.vaultService.getVault());
    if (vault) {
      const date = new Date();
      downloadFile(vault, `vault-backup-UTC--${date.toISOString()}.txt`);
    }
  }

  private postProcessEncryptedVaultFile(encryptedFile: string) {
    const parsedFile = JSON.parse(encryptedFile);
    const newKeysFile: any = { };

    newKeysFile.data = parsedFile.data;
    newKeysFile.encryptionAlgo = {
      name: 'AES-GCM',
      iv: parsedFile.iv,
      salt: parsedFile.salt,
      tagLength: 128
    };

    return JSON.stringify(newKeysFile, null, 2);
  }
}
