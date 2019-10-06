import { Component, Input } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  templateUrl: './password.dialog.component.html',
  styleUrls: ['./password.dialog.component.scss']
})

export class PasswordDialogComponent {
  @Input() public message: string;
  public passwordForm;

  constructor(public activeModal: NgbActiveModal, private formBuilder: FormBuilder) {
    this.passwordForm = this.formBuilder.group({
      password: ['', [Validators.required]]
    });
  }

  public onConfirm() {
    return this.activeModal.close(this.passwordForm.value.password);
  }

  public onCancel() {
    return this.activeModal.close('');
  }
}
