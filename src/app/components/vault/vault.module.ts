import { VaultRoutingModule } from './vault.routing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgModule } from '@angular/core';
import { ModalsModule } from '../modals/modals.module';
import { DIDModule } from '../did/did.module';

import { vaultComponents } from '.';

@NgModule({
  declarations: [
    ...vaultComponents
  ],
  imports: [
    VaultRoutingModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModalsModule,
    DIDModule
  ],
  exports: [
    ...vaultComponents
  ]
})
export class VaultModule { }
