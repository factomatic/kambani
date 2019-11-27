import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CreateActionGuard } from './create-action.guard';
import { FinalComponentGuard } from './final-component.guard';
import { VaultGuard } from './vault.guard';

@NgModule({
  providers: [
    CreateActionGuard,
    FinalComponentGuard,
    VaultGuard
  ],
  imports: [
    CommonModule
  ]
})
export class GuardsModule { }
