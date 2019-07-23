import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router
} from '@angular/router';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { VaultService } from '../services/vault/vault.service';

@Injectable({
 providedIn: 'root'
})
export class VaultGuard implements CanActivate {

 constructor(
  private router: Router,
  private vaultService: VaultService) { }

 canActivate(
   next: ActivatedRouteSnapshot,
   state: RouterStateSnapshot ): Observable<boolean> | Promise<boolean> | boolean {

  if (this.vaultService.vaultExists()) {
    return true;
  }

  this.router.navigate(['/vault/create']);
  return false;
 }
}
