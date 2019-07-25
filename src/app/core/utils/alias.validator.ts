import { Directive } from '@angular/core';
import { NG_VALIDATORS, FormControl, ValidatorFn, Validator } from '@angular/forms';
import { Store, select } from '@ngrx/store';

import { AppState } from 'src/app/core/store/app.state';
import { DidKeyModel } from '../models/did-key.model';
import { ManagementKeyModel } from '../models/management-key.model';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[aliasvalidator][ngModel]',
  providers: [
   {
    provide: NG_VALIDATORS,
    useExisting: AliasValidator,
    multi: true
   }
  ]
})
export class AliasValidator implements Validator {
  validator: ValidatorFn;
  private managementKeys: ManagementKeyModel[];
  private didKeys: DidKeyModel[];
  private originalAlias: string;

  constructor(private store: Store<AppState>) {
    this.store
      .pipe(select(state => state))
      .subscribe(state => {
        this.managementKeys = state.form.managementKeys;
        this.didKeys = state.form.didKeys;
      });

    this.validator = this.aliasValidator();
  }

  validate(c: FormControl) {
    return this.validator(c);
  }

  aliasValidator(): ValidatorFn {
    return (c: FormControl) => {
      if (!this.originalAlias) {
        this.originalAlias = c.value;
        return null;
      }

      if ((!this.managementKeys.find(k => k.alias === c.value)
        && !this.didKeys.find(k => k.alias === c.value)) || this.originalAlias === c.value) {
        return null;
      }

      return {
        aliasvalidator: {
          valid: false
        }
      };
    };
  }
}
