import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from 'src/app/components/base.component';
import { ClearCreateDIDState } from 'src/app/core/store/create-did/create-did.actions';
import { SharedRoutes } from 'src/app/core/enums/shared-routes';

@Component({
  selector: 'app-final',
  templateUrl: './final.component.html',
  styleUrls: ['./final.component.scss']
})
export class FinalComponent extends BaseComponent implements OnInit {
  private subscription: Subscription;
  public externalLink: string;
  public didId: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store<AppState>) {
    super();
  }

  ngOnInit() {
    this.subscription = this.route.queryParams.subscribe(params => {
      this.externalLink = params.url;
      this.didId = params.didId;
    });

    this.subscriptions.push(this.subscription);
    this.store.dispatch(new ClearCreateDIDState());
  }

  createAnotherDID() {
    this.router.navigate([SharedRoutes.Action]);
  }
}
