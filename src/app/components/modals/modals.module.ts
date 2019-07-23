import { CommonModule } from '@angular/common';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';

import { modalComponents } from '.';

@NgModule({
  declarations: [
    ...modalComponents
  ],
  imports: [
    CommonModule,
    MDBBootstrapModule.forRoot(),
    NgbModule
  ],
  exports: [
    ...modalComponents
  ],
  entryComponents: [
    ...modalComponents
  ]
})
export class ModalsModule { }
