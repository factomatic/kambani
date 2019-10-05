import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CreateVaultComponent } from './create-vault/create-vault.component';
import { RestoreVaultComponent } from './restore-vault/restore-vault.component';
import { VaultBackupComponent } from './vault-backup/vault-backup.component';
import { VaultGuard } from '../../core/guards/vault.guard';

const carsRoutes: Routes = [
  { path: 'backup', component: VaultBackupComponent, canActivate: [VaultGuard] },
  { path: 'create', component: CreateVaultComponent },
  { path: 'restore', component: RestoreVaultComponent }
];

@NgModule({
  imports: [RouterModule.forChild(carsRoutes)],
  exports: [RouterModule]
})
export class VaultRoutingModule { }
