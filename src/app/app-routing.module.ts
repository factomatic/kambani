import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActionComponent } from './components/did/action/action.component';
import { ApprovalRequestsComponent } from './components/approval-requests/approval-requests.component';
import { CreateActionGuard } from './core/guards/create-action.guard';
import { DidKeyFormComponent } from './components/did/update-did/did-key-form/did-key-form.component';
import { HomeComponent } from './components/home/home.component';
import { ManageDidsComponent } from './components/did/manage-dids/manage-dids.component';
import { ManagementKeyFormComponent } from './components/did/update-did/management-key-form/management-key-form.component';
import { PreviewDidComponent } from './components/did/preview-did/preview-did.component';
import { ServiceFormComponent } from './components/did/update-did/service-form/service-form.component';
import { SettingsComponent } from './components/settings/settings.component';
import { SignerComponent } from './components/signer/signer.component';
import { VaultGuard } from './core/guards/vault.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent, canActivate: [VaultGuard] },
  { path: 'signer', component: SignerComponent, canActivate: [VaultGuard] },
  { path: 'vault', loadChildren: './components/vault/vault.module#VaultModule' },
  { path: 'dids/manage', component: ManageDidsComponent, canActivate: [VaultGuard], children: [
    { path: 'action', component: ActionComponent },
    { path: 'create', loadChildren: './components/did/did.module#DIDModule', canActivate: [ CreateActionGuard ] }
  ] },
  { path: 'dids/preview/:id', component: PreviewDidComponent, canActivate: [VaultGuard], children: [
    { path: 'create-management-key', component: ManagementKeyFormComponent },
    { path: 'update-management-key/:id', component: ManagementKeyFormComponent },
    { path: 'create-did-key', component: DidKeyFormComponent },
    { path: 'update-did-key/:id', component: DidKeyFormComponent },
    { path: 'create-service', component: ServiceFormComponent },
  ] },
  { path: 'factom', loadChildren: './components/factom-addresses/factom-addresses.module#FactomAddressesModule' },
  { path: 'keys', loadChildren: './components/keys/keys.module#KeysModule' },
  { path: 'approve', component: ApprovalRequestsComponent, canActivate: [VaultGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [VaultGuard] },
  { path: '**', component: HomeComponent, canActivate: [VaultGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
