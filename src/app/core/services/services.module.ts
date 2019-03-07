import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { services } from './index';

@NgModule({
  providers: [
    ...services
  ],
  imports: [
    CommonModule
  ]
})
export class ServicesModule { }
