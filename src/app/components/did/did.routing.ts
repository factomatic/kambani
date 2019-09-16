import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DidKeysComponent } from './did-keys/did-keys.component';
import { FinalComponent } from './final/final.component';
import { FinalComponentGuard } from 'src/app/core/guards/final-component.guard';
import { ManagementKeysComponent } from './management-keys/management-keys.component';
import { ProvideDidComponent } from './provide-did/provide-did.component';
import { ServicesComponent } from './services/services.component';
import { PreviewDidComponent } from './preview-did/preview.did.component';
import { SummaryComponent } from './summary/summary.component';
import { UpdateActionGuard } from 'src/app/core/guards/update-action.guard';

const didRoutes: Routes = [
  { path: 'provide-did', component: ProvideDidComponent, canActivate: [ UpdateActionGuard ] },
  { path: 'keys/did', component: DidKeysComponent },
  { path: 'keys/management', component: ManagementKeysComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'previewdid', component: PreviewDidComponent },
  { path: 'summary', component: SummaryComponent },
  { path: 'final', component: FinalComponent, canActivate: [ FinalComponentGuard ] }
];

@NgModule({
  imports: [RouterModule.forChild(didRoutes)],
  exports: [RouterModule]
})
export class DIDRoutingModule { }
