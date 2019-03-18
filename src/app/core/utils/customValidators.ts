import { FormGroup } from '@angular/forms';

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
}
