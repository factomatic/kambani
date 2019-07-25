import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-create-advanced-info-modal',
  templateUrl: './create-advanced-info-modal.component.html',
  styleUrls: ['./create-advanced-info-modal.component.scss']
})
export class CreateAdvancedInfoModalComponent {
  constructor(public activeModal: NgbActiveModal) { }
}
