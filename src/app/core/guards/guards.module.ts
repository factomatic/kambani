import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { VaultGuard } from './vault.guard';

@NgModule({
  providers: [ VaultGuard ],
  imports: [
    CommonModule
  ]
})
export class GuardsModule { }
