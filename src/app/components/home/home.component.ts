import { Component, OnInit } from '@angular/core';
import { KeyViewModel } from 'src/app/core/models/KeyViewModel';
import { minifyPublicKey } from '../../core/utils/helpers';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public availableKeys: KeyViewModel[] = [];

  constructor(private vaultService: VaultService) { }

  ngOnInit() {
    const publicKeys = this.vaultService.getVaultPublicKeys();
    if (publicKeys) {
      const publicKeysArray = JSON.parse(publicKeys);
      const publicKeysAliases = JSON.parse(this.vaultService.getVaultPublicKeysAliases());
      publicKeysArray.forEach(publicKey => {
        this.availableKeys.push(new KeyViewModel(
          publicKeysAliases[publicKey] ? publicKeysAliases[publicKey] : 'unknown',
          minifyPublicKey(publicKey)
        ));
      });
    }
  }
}
