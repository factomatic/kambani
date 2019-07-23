import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

import { KeyModel } from '../models/key.model';
import { ServiceModel } from '../models/service.model';

export default class CustomValidators {
  static passwordsDoMatch(createFormGroup: FormGroup) {
    const password = createFormGroup.controls.password.value;
    const repeatPassword = createFormGroup.controls.confirmPassword.value;

    if (!repeatPassword) {
      return null;
    }

    if (repeatPassword !== password) {
      return {
        passwordsMismatch: true
      };
    }

    return null;
  }
  static uniqueKeyAlias(publicKeys: KeyModel[], authenticationKeys: KeyModel[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value !== null) {
        if (!publicKeys.find(k => k.alias === control.value)
          && !authenticationKeys.find(k => k.alias === control.value)) {
          return null;
        }

        return {taken: true};
      }

      return null;
    };
  }

  static uniqueServiceAlias(services: ServiceModel[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value !== null) {
        if (services.find(s => s.alias === control.value)) {
          return {taken: true};
        }
      }

      return null;
    };
  }
}
