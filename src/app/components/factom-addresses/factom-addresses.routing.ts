import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ImportAddressComponent } from './import-address/import-address.component';
import { ManageAddressesComponent } from './manage-addresses/manage-addresses.component';

const factomAddressesRoutes: Routes = [
  { path: 'addresses/import/:type', component: ImportAddressComponent },
  { path: 'addresses/manage', component: ManageAddressesComponent },
];

@NgModule({
  imports: [RouterModule.forChild(factomAddressesRoutes)],
  exports: [RouterModule]
})
export class FactomAddressesRoutingModule { }