import { Component, OnInit } from '@angular/core';
import { SigningService } from 'src/app/core/services/signing/signing.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public pendingRequestsCount = 0;

  constructor(private signingService: SigningService) { }

  ngOnInit() {
    chrome.browserAction.getBadgeText({}, (result) => {
      this.pendingRequestsCount = parseInt(result, 10);
    });

    this.signingService.change.subscribe(pendingRequestsCount => {
      this.pendingRequestsCount = pendingRequestsCount;
    });
  }
}
