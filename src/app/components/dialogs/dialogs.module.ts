import { CommonModule } from '@angular/common';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { dialogComponents } from '.';

@NgModule({
  imports: [
    NgbModule,
    CommonModule,
    ReactiveFormsModule
  ],
  providers: [],
  declarations: [...dialogComponents],
  exports: [...dialogComponents],
  entryComponents: [...dialogComponents]
})

export class DialogsModule { }
