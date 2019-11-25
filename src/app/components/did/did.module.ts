import { CommonModule } from '@angular/common';
import { ClickOutsideModule } from 'ng-click-outside';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HighlightJsModule, HIGHLIGHT_JS } from 'angular-highlight-js';
import hljs from 'highlight.js/lib/highlight';
import json from 'highlight.js/lib/languages/json';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';

import { AliasValidator } from 'src/app/core/utils/alias.validator';
import { didComponents } from '.';
import { DIDRoutingModule } from './did.routing';

hljs.registerLanguage('json', json);

export function highlightJsFactory() {
  return hljs;
}

@NgModule({
  declarations: [
    AliasValidator,
    ...didComponents
  ],
  imports: [
    CommonModule,
    ClickOutsideModule,
    DIDRoutingModule,
    FormsModule,
    HighlightJsModule.forRoot({
      provide: HIGHLIGHT_JS,
      useFactory: highlightJsFactory
    }),
    MDBBootstrapModule.forRoot(),
    NgbModule,
    ReactiveFormsModule
  ],
  exports: [
    ...didComponents
  ]
})
export class DIDModule { }
