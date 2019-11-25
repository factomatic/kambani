import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

import { DidKeyModel } from '../models/did-key.model';
import { ManagementKeyModel } from '../models/management-key.model';
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

  static uniqueKeyAlias(managementKeys: ManagementKeyModel[], didKeys: DidKeyModel[], originalValue?: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const hasOriginalValue = originalValue && originalValue.length > 0;
      if (control.value !== null && (!hasOriginalValue || originalValue !== control.value)) {
        if (!managementKeys.find(k => k.alias === control.value)
          && !didKeys.find(k => k.alias === control.value)) {
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
