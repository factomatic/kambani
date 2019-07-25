import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';

import { vaultComponents } from '.';
import { VaultRoutingModule } from './vault.routing';

@NgModule({
  declarations: [
    ...vaultComponents
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    VaultRoutingModule
  ],
  exports: [
    ...vaultComponents
  ]
})
export class VaultModule { }
