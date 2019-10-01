/// <reference types="chrome" />

import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { ChromeMessageType } from './core/enums/chrome-message-type';
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
    try {
      chrome.runtime.sendMessage({type: ChromeMessageType.CheckRequests}, (checkRequestsResponse) => {
        if (checkRequestsResponse.importKeysRequested) {
          this.zone.run(() => {
            this.router.navigate(['/vault/import']);
          });
        } else if (checkRequestsResponse.restoreVaultRequested) {
          this.zone.run(() => {
            this.router.navigate(['/vault/restore']);
          });
        } else if (checkRequestsResponse.manageDidsRequested) {
          this.zone.run(() => {
            this.router.navigate(['/dids/manage']);
          });
        } else {
          chrome.runtime.sendMessage({type: ChromeMessageType.PendingRequestsCount}, (pendingRequestsResponse) => {
            this.zone.run(() => {
              if (pendingRequestsResponse.pendingRequestsCount > 0) {
                this.router.navigate(['signer']);
              }
            });
          });
        }
      });
    }
    catch(err){
      console.error("This app should run as a Chrome extension.");
      throw(err);
    }
  }
}
