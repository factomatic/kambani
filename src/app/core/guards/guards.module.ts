import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CreateActionGuard } from './create-action.guard';
import { VaultGuard } from './vault.guard';

@NgModule({
  providers: [
    CreateActionGuard,
    VaultGuard
  ],
  imports: [
    CommonModule
  ]
})
export class GuardsModule { }
