import { CommonModule } from '@angular/common';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { dialogComponents } from '.';

@NgModule({
  imports: [
    CommonModule,
    MDBBootstrapModule.forRoot(),
    NgbModule,
    ReactiveFormsModule
  ],
  providers: [],
  declarations: [...dialogComponents],
  exports: [...dialogComponents],
  entryComponents: [...dialogComponents]
})

export class DialogsModule { }
