import { CommonModule } from '@angular/common';
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

import { ClickOutsideModule } from 'ng-click-outside';

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
    DIDRoutingModule,
    FormsModule,
    HighlightJsModule.forRoot({
      provide: HIGHLIGHT_JS,
      useFactory: highlightJsFactory
    }),
    MDBBootstrapModule.forRoot(),
    NgbModule,
    ClickOutsideModule,
    ReactiveFormsModule
  ],
  exports: [
    ...didComponents
  ]
})
export class DIDModule { }
