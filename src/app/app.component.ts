/// <reference types="chrome" />

import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { VaultService } from './core/services/vault/vault.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  constructor(
    public vaultService: VaultService,
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
  }
}
