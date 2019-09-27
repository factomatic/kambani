import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ActionComponent } from './components/did/action/action.component';
import { CreateActionGuard } from './core/guards/create-action.guard';
import { HomeComponent } from './components/home/home.component';
import { ManageDidsComponent } from './components/did/manage-dids/manage-dids.component';
import { PreviewDidComponent } from './components/did/preview-did/preview.did.component';
import { SignerComponent } from './components/signer/signer.component';
import { UpdateActionGuard } from './core/guards/update-action.guard';
import { VaultGuard } from './core/guards/vault.guard';
import { SummaryComponent } from './components/did/summary/summary.component';
import { FinalComponent } from './components/did/final/final.component';
import { FinalComponentGuard } from 'src/app/core/guards/final-component.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent, canActivate: [VaultGuard] },
  { path: 'signer', component: SignerComponent, canActivate: [VaultGuard] },
  { path: 'vault', loadChildren: './components/vault/vault.module#VaultModule' },
  { path: 'dids/manage', component: ManageDidsComponent, canActivate: [VaultGuard], children: [
    // {path: '', redirectTo: 'action'},
    { path: 'action', component: ActionComponent },
    { path: 'summary', component: SummaryComponent },
    { path: 'final', component: FinalComponent, canActivate: [ FinalComponentGuard ] },
    { path: 'create', loadChildren: './components/did/did.module#DIDModule', canActivate: [ CreateActionGuard ] },
    { path: 'update', loadChildren: './components/did/did.module#DIDModule', canActivate: [ UpdateActionGuard ] }

  ] },
  { path: 'dids/preview/:id', component: PreviewDidComponent, canActivate: [VaultGuard] },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
