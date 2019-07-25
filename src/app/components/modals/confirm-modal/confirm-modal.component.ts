import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { capitalize } from 'src/app/core/utils/helpers';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {
  @Input() public objectType: string;
  public capitalize = capitalize;

  constructor(
    public activeModal: NgbActiveModal,
  ) { }
}
