import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { capitalize } from 'src/app/core/utils/helpers';

@Component({
  selector: 'app-remove-confirm-modal',
  templateUrl: './remove-confirm-modal.component.html',
  styleUrls: ['./remove-confirm-modal.component.scss']
})
export class RemoveConfirmModalComponent {
  @Input() public objectType: string;
  public capitalize = capitalize;

  constructor(
    public activeModal: NgbActiveModal,
  ) { }
}
