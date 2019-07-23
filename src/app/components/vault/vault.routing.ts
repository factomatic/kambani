import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreateVaultComponent } from './create-vault/create-vault.component';
import { ImportKeysComponent } from './import-keys/import-keys.component';
import { CreateKeyComponent } from './create-key/create-key.component';
import { RestoreVaultComponent } from './restore-vault/restore-vault.component';
import { VaultBackupComponent } from './vault-backup/vault-backup.component';
import { VaultGuard } from '../../core/guards/vault.guard';
import { CreateActionGuard } from '../../core/guards/create-action.guard';
import { FinalComponent } from '../shared/final/final.component';
import { FinalComponentGuard } from '../../core/guards/final-component.guard';
import { UpdateActionGuard } from '../../core/guards/update-action.guard';

const carsRoutes: Routes = [
  { path: 'backup', component: VaultBackupComponent, canActivate: [VaultGuard] },
  { path: 'create', component: CreateVaultComponent },
  { path: 'createkey', component: CreateKeyComponent },
  { path: 'createkey', loadChildren: '../did/did.module#DIDModule', canActivate: [ CreateActionGuard ] },
  { path: 'final', component: FinalComponent, canActivate: [ FinalComponentGuard ] },
  { path: 'update', loadChildren: '../did/did.module#DIDModule', canActivate: [ UpdateActionGuard ] },
  { path: 'import', component: ImportKeysComponent, canActivate: [VaultGuard] },
  { path: 'restore', component: RestoreVaultComponent }
];

@NgModule({
  imports: [RouterModule.forChild(carsRoutes)],
  exports: [RouterModule]
})
export class VaultRoutingModule { }
