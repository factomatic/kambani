import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DidKeysComponent } from './did-keys/did-keys.component';
import { ManagementKeysComponent } from './management-keys/management-keys.component';
import { ServicesComponent } from './services/services.component';
import { SummaryComponent } from './summary/summary.component';

const didRoutes: Routes = [
  { path: 'keys/did', component: DidKeysComponent },
  { path: 'keys/management', component: ManagementKeysComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'summary', component: SummaryComponent }
];

@NgModule({
  imports: [RouterModule.forChild(didRoutes)],
  exports: [RouterModule]
})
export class DIDRoutingModule { }
