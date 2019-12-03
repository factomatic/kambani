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
import { PriorityMaxValidator } from 'src/app/core/utils/priority.max.validator';
import { PriorityMinValidator } from 'src/app/core/utils/priority.min.validator';
import { AutofocusModule } from 'angular-autofocus-fix';

hljs.registerLanguage('json', json);

export function highlightJsFactory() {
  return hljs;
}

@NgModule({
  declarations: [
    AliasValidator,
    PriorityMaxValidator,
    PriorityMinValidator,
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
    ReactiveFormsModule,
    AutofocusModule
  ],
  exports: [
    ...didComponents
  ]
})
export class DIDModule { }
