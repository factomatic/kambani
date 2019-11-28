import { Component, OnInit, NgZone } from '@angular/core';
import { HostListener } from "@angular/core";
import { Router } from '@angular/router';

import { ChromeMessageType } from './core/enums/chrome-message-type';
import { VaultService } from './core/services/vault/vault.service';
import { AppState } from './core/store/app.state';
import { Store, select } from '@ngrx/store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private pendingChanges: boolean;

  constructor(
    public vaultService: VaultService,
    public router: Router,
    private store: Store<AppState>,
    private zone: NgZone) { }

  ngOnInit() {
    try {
      chrome.runtime.sendMessage({type: ChromeMessageType.CheckRequests}, (checkRequestsResponse) => {
        if (checkRequestsResponse.restoreVaultRequested) {
          this.zone.run(() => {
            this.router.navigate(['/vault/restore']);
          });
        } else if (checkRequestsResponse.manageDidsRequested) {
          this.zone.run(() => {
            this.router.navigate(['/dids/manage']);
          });
        } else if (checkRequestsResponse.manageFactomAddressesRequested) {
          this.zone.run(() => {
            this.router.navigate(['/factom/addresses/manage']);
          });
        } else {
          chrome.runtime.sendMessage({type: ChromeMessageType.PendingSigningRequestsCount}, (pendingRequestsResponse) => {
            this.zone.run(() => {
              const pendingRequests = pendingRequestsResponse.pendingSigningRequestsCount;
              chrome.browserAction.getBadgeText({}, function(result) {
                if (parseInt(result) !== pendingRequests) {
                  chrome.browserAction.setBadgeText({text: pendingRequests.toString()});
                }
              });

              if (pendingRequests > 0) {
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

    this.store
      .pipe(select(state => state.updateDID))
      .subscribe(updateDIDState => {
        if (updateDIDState.didsWithPendingChanges.length > 0) {
          this.pendingChanges = true;
        } else {
          this.pendingChanges = false;
        }
      });
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.pendingChanges) {
      $event.returnValue = true;
    }
  }
}
