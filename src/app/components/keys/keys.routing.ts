import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ManageKeysComponent } from './manage-keys/manage-keys.component';

const keysRoutes: Routes = [
  { path: 'manage', component: ManageKeysComponent },
];

@NgModule({
  imports: [RouterModule.forChild(keysRoutes)],
  exports: [RouterModule]
})
export class KeysRoutingModule { }