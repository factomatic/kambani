import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  templateUrl: './close-vault.dialog.component.html'
})

export class CloseVaultDialogComponent {
  constructor(public activeModal: NgbActiveModal) { }

  public onConfirm() {
    return this.activeModal.close('confirm');
  }

  public onCancel() {
    return this.activeModal.close('cancel');
  }
}
