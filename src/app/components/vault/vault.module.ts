import { VaultRoutingModule } from './vault.routing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { vaultComponents } from '.';

@NgModule({
  declarations: [
    ...vaultComponents
  ],
  imports: [
    VaultRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    ...vaultComponents
  ]
})
export class VaultModule { }
