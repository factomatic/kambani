import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AuthenticationKeysComponent } from './authentication-keys/authentication-keys.component';
import { EncryptKeysComponent } from './encrypt-keys/encrypt-keys.component';
import { ProvideDidComponent } from './provide-did/provide-did.component';
import { PublicKeysComponent } from './public-keys/public-keys.component';
import { ServicesComponent } from './services/services.component';
import { SummaryComponent } from './summary/summary.component';
import { UpdateActionGuard } from 'src/app/core/guards/update-action.guard';

const didRoutes: Routes = [
  { path: 'did', component: ProvideDidComponent, canActivate: [ UpdateActionGuard ] },
  { path: 'keys/authentication', component: AuthenticationKeysComponent },
  { path: 'keys/encrypt', component: EncryptKeysComponent },
  { path: 'keys/public', component: PublicKeysComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'summary', component: SummaryComponent }
];

@NgModule({
  imports: [RouterModule.forChild(didRoutes)],
  exports: [RouterModule]
})
export class CreateDIDRoutingModule { }
