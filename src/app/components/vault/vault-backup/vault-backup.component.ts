import { Component, OnInit } from '@angular/core';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-vault-backup',
  templateUrl: './vault-backup.component.html',
  styleUrls: ['./vault-backup.component.scss']
})
export class VaultBackupComponent implements OnInit {
  public publicKeysAny: boolean;

  constructor(private vaultService: VaultService) { }

  ngOnInit() {
    const publicKeys = this.vaultService.getVaultPublicKeys();
    if (publicKeys) {
      this.publicKeysAny = JSON.parse(publicKeys).length > 0;
    }
  }

  downloadJSONFile() {
    const vault = this.vaultService.getVault();
    if (vault) {
      const downloader = document.createElement('a');
      document.body.appendChild(downloader);

      const blob = new Blob([vault], { type: 'text/json' });
      const url = window.URL;
      const fileUrl = url.createObjectURL(blob);

      downloader.setAttribute('href', fileUrl);
      const date = new Date();
      downloader.setAttribute('download', `vault-backup-UTC--${date.toISOString()}.txt`);
      downloader.click();
    }
  }
}
