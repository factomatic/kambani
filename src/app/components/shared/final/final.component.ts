import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { BaseComponent } from 'src/app/components/base.component';
import { SharedRoutes } from 'src/app/core/enums/shared-routes';

@Component({
  selector: 'app-final',
  templateUrl: './final.component.html',
  styleUrls: ['./final.component.scss']
})
export class FinalComponent extends BaseComponent implements OnInit {
  private subscription$: Subscription;
  public externalLink: string;
  public didId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router) {
    super();
  }

  ngOnInit() {
    this.subscription$ = this.route.queryParams.subscribe(params => {
      this.externalLink = params.url;
      this.didId = params.didId;
    });

    this.subscriptions.push(this.subscription$);
  }

  chooseAnotherAction() {
    this.router.navigate([SharedRoutes.Action]);
  }
}
