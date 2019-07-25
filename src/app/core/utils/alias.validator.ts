import { Directive } from '@angular/core';
import { NG_VALIDATORS, FormControl, ValidatorFn, Validator } from '@angular/forms';
import { Store, select } from '@ngrx/store';

import { AppState } from 'src/app/core/store/app.state';
import { KeyModel } from '../models/key.model';

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
  private publicKeys: KeyModel[];
  private authenticationKeys: KeyModel[];
  private originalAlias: string;

  constructor(private store: Store<AppState>) {
    this.store
      .pipe(select(state => state))
      .subscribe(state => {
        this.publicKeys = state.form.publicKeys;
        this.authenticationKeys = state.form.authenticationKeys;
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

      if ((!this.publicKeys.find(k => k.alias === c.value)
        && !this.authenticationKeys.find(k => k.alias === c.value)) || this.originalAlias === c.value) {
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
