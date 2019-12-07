import { Directive } from '@angular/core';
import { NG_VALIDATORS, FormControl, Validator } from '@angular/forms';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[priorityminvalidator][ngModel]',
  providers: [
   {
    provide: NG_VALIDATORS,
    useExisting: PriorityMinValidator,
    multi: true
   }
  ]
})
export class PriorityMinValidator implements Validator {

  validate(c: FormControl) {
    let v = c.value;
    return ( v < 0)? {"priorityMin": true} : null;
  }
}