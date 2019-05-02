import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './components/home/home.component';
import { SignerComponent } from './components/signer/signer.component';
import { VaultGuard } from './core/guards/vault.guard';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: 'home', component: HomeComponent, canActivate: [VaultGuard] },
  { path: 'signer', component: SignerComponent, canActivate: [VaultGuard] },
  { path: 'vault', loadChildren: './components/vault/vault.module#VaultModule' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
