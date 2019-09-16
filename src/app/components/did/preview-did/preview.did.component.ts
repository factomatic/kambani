import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { BaseComponent } from 'src/app/components/base.component';
import { SharedRoutes } from 'src/app/core/enums/shared-routes';

@Component({
  selector: 'app-preview-did',
  templateUrl: './preview.did.component.html',
  styleUrls: ['./preview.did.component.scss']
})
export class PreviewDidComponent extends BaseComponent implements OnInit {

  public didId: string;

  constructor() {
    super();
  }

  ngOnInit() {

  }

}
