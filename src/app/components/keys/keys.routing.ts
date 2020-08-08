import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ImportKeyComponent } from './import-key/import-key.component';
import { ManageKeysComponent } from './manage-keys/manage-keys.component';

const keysRoutes: Routes = [
  { path: 'import', component: ImportKeyComponent },
  { path: 'manage', component: ManageKeysComponent },
];

@NgModule({
  imports: [RouterModule.forChild(keysRoutes)],
  exports: [RouterModule]
})
export class KeysRoutingModule { }