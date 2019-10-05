import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  templateUrl: './remove-vault.dialog.component.html',
  styleUrls: ['./remove-vault.dialog.component.scss']
})

export class RemoveVaultDialogComponent {
  constructor(public activeModal: NgbActiveModal) { }

  public onConfirm() {
    return this.activeModal.close('confirm');
  }

  public onCancel() {
    return this.activeModal.close('cancel');
  }
}
