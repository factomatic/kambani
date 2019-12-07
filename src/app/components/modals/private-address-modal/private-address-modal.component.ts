import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-private-address-modal',
  templateUrl: './private-address-modal.component.html',
  styleUrls: ['./private-address-modal.component.scss']
})
export class PrivateAddressModalComponent {
  @Input() public publicAddress: string;
  @Input() public privateAddress: string;

  constructor(
    public activeModal: NgbActiveModal,
  ) { }

  copyAddress(address: string, element) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = address;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    element.classList.add('clicked');
    setTimeout(() => {element.classList.remove('clicked')},2000);
  }
}