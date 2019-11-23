import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

import { DidKeyModel } from '../models/did-key.model';
import { ManagementKeyModel } from '../models/management-key.model';
import { ServiceModel } from '../models/service.model';

import { DidKeyEntryModel } from 'src/app/core/interfaces/did-key-entry';
import { ManagementKeyEntryModel } from 'src/app/core/interfaces/management-key-entry';

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

  static uniqueKeyAlias(managementKeys: ManagementKeyModel[], didKeys: DidKeyModel[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value !== null) {
        if (!managementKeys.find(k => k.alias === control.value)
          && !didKeys.find(k => k.alias === control.value)) {
          return null;
        }

        return {taken: true};
      }

      return null;
    };
  }

  static uniqueKeyAlias2(managementKeys: ManagementKeyEntryModel[], didKeys: DidKeyEntryModel[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (control.value !== null) {
        if (!managementKeys.find(k => k.id.split('#')[1] === control.value)
          && !didKeys.find(k => k.id === control.value)) {
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
