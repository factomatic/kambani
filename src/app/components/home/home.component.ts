import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { VaultService } from 'src/app/core/services/vault/vault.service';

import { minifyPublicKey } from '../../core/utils/helpers';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  protected minifiedPubKeys = [];
  private publicKeys = [];

  constructor(
    private vaultService: VaultService,
    private router: Router,
    private zone: NgZone) { }

  ngOnInit() {
    chrome.runtime.sendMessage({type: 'popupInit'}, (response) => {
      this.zone.run(() => {
        if (response.success) {
          this.router.navigate(['signer'], { queryParams: {
            contentToSign: JSON.stringify(response.contentToSign)
          }});
        }
      });
    });

    const publicKeys = this.vaultService.getVaultPublicKeys();
    if (publicKeys) {
      this.publicKeys = JSON.parse(publicKeys);
      this.publicKeys.forEach(key => {
        this.minifiedPubKeys.push(minifyPublicKey(key));
      });
    }
  }
}
