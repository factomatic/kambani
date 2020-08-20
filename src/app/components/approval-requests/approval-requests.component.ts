import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { ToastrService } from 'ngx-toastr';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-approval-requests',
  templateUrl: './approval-requests.component.html',
  styleUrls: ['./approval-requests.component.scss']
})
export class ApprovalRequestsComponent implements OnInit {
  public type: string;
  public from: string;
  public displayName: string;
  public requestsCount: number;

  constructor(
    private router: Router,
    private toastr: ToastrService,
    private vaultService: VaultService,
    private zone: NgZone) { }

  ngOnInit() {
    this.getApprovalRequestsCount();
    this.getApprovalRequest();
  }

  sendRequestResponse(approved: boolean) {
    if (approved) {
      if (this.type === 'Pegnet') {
        this.vaultService.addWhitelistedDomain('FCT', this.from);
        this.vaultService.addWhitelistedDomain('EtherLink', this.from);
      } else {
        this.vaultService.addWhitelistedDomain(this.type, this.from);
      }
      
      this.toastr.success('Request approved!', null, {timeOut: 1000});
    } else {
      this.toastr.info('Request cancelled!', null, {timeOut: 1000});
    }

    chrome.runtime.sendMessage({type: ChromeMessageType.SendApprovalRequestResponse, success: approved}, (response) => {
      this.zone.run(() => {
        this.requestsCount = response.approvalRequestsCount;
        this.getApprovalRequest();
      });
    });
  }

  private getApprovalRequest() {
    chrome.runtime.sendMessage({type: ChromeMessageType.GetApprovalRequest}, (response) => {
      this.zone.run(() => {
        if (response.success) {
          const request = response.approvalRequest;
          this.type = request.type;
          this.from = request.from;

          switch (this.type) {
            case 'Pegnet':
              this.displayName = 'FCT and EtherLink addresses';
              break;
            case 'BlockSigningKey':
              this.displayName = 'Block Signing keys';
              break;
            default:
              this.displayName = this.type + ' addresses'
              break;
          }
        } else {
          this.router.navigate(['home']);
        }
      });
    });
  }

  private getApprovalRequestsCount() {
    chrome.runtime.sendMessage({type: ChromeMessageType.ApprovalRequestsCount}, (response) => {
      this.zone.run(() => {
        this.requestsCount = response.approvalRequestsCount;
      });
    });
  }
}
