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
    chrome.runtime.sendMessage({type: ChromeMessageType.PendingRequestsCount}, (response) => {
      this.zone.run(() => {
        if (response.pendingRequestsCount > 0) {
          this.router.navigate(['signer']);
        }
      });
    });
  }
}
