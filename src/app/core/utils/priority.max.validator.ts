import { Directive } from '@angular/core';
import { NG_VALIDATORS, FormControl, Validator } from '@angular/forms';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: '[prioritymaxvalidator][ngModel]',
  providers: [
   {
    provide: NG_VALIDATORS,
    useExisting: PriorityMaxValidator,
    multi: true
   }
  ]
})
export class PriorityMaxValidator implements Validator {

  validate(c: FormControl) {
    let v = c.value;
    return ( v > 100)? {"priorityMax": true} : null;
  }
}