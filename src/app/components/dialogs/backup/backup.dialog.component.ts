import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  templateUrl: './backup.dialog.component.html',
  styleUrls: ['./backup.dialog.component.scss']
})
export class BackupDialogComponent {
  constructor(public activeModal: NgbActiveModal) { }

  public onConfirm() {
    return this.activeModal.close('confirm');
  }
}