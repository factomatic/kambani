import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';

import { factomAddressesComponents } from '.';
import { FactomAddressesRoutingModule } from './factom-addresses.routing';

@NgModule({
  declarations: [
    ...factomAddressesComponents
  ],
  imports: [
    CommonModule,
    FactomAddressesRoutingModule,
    FormsModule,
    MDBBootstrapModule.forRoot(),
    NgbModule,
    ReactiveFormsModule
  ],
  exports: [
    ...factomAddressesComponents
  ]
})
export class FactomAddressesModule { }