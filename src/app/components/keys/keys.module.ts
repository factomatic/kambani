import { AutofocusModule } from 'angular-autofocus-fix';
import { CommonModule } from '@angular/common';
import { ClickOutsideModule } from 'ng-click-outside';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';

import { keysComponents } from '.';
import { KeysRoutingModule } from './keys.routing';

@NgModule({
  declarations: [
    ...keysComponents
  ],
  imports: [
    AutofocusModule,
    CommonModule,
    ClickOutsideModule,
    KeysRoutingModule,
    FormsModule,
    MDBBootstrapModule.forRoot(),
    NgbModule,
    ReactiveFormsModule
  ],
  exports: [
    ...keysComponents
  ]
})
export class KeysModule { }