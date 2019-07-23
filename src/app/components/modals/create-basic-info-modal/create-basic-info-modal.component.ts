import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-create-basic-info-modal',
  templateUrl: './create-basic-info-modal.component.html',
  styleUrls: ['./create-basic-info-modal.component.scss']
})
export class CreateBasicInfoModalComponent {
  constructor(public activeModal: NgbActiveModal) { }
}
