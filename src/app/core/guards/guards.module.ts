import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { VaultGuard } from './vault.guard';
import { CreateActionGuard } from './create-action.guard';
import { FinalComponentGuard } from './final-component.guard';
import { UpdateActionGuard } from './update-action.guard';

@NgModule({
  providers: [
    VaultGuard,
    CreateActionGuard,
    FinalComponentGuard,
    UpdateActionGuard
  ],
  imports: [
    CommonModule
  ]
})
export class GuardsModule { }
