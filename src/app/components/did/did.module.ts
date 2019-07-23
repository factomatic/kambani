import { AliasValidator } from 'src/app/core/utils/alias.validator';
import { CommonModule } from '@angular/common';
import { createComponents } from '.';
import { CreateDIDRoutingModule } from './did.routing';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { HighlightJsModule, HIGHLIGHT_JS } from 'angular-highlight-js';
import hljs from 'highlight.js/lib/highlight';
import json from 'highlight.js/lib/languages/json';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';

hljs.registerLanguage('json', json);

export function highlightJsFactory() {
  return hljs;
}

@NgModule({
  declarations: [
    AliasValidator,
    ...createComponents
  ],
  imports: [
    CommonModule,
    CreateDIDRoutingModule,
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
    ...createComponents
  ]
})
export class DIDModule { }
