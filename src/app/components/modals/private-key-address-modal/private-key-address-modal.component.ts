import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
  convertECDSAPublicKeyToEthereumAddress,
  convertECDSAPublicKeyToEtherLinkAddress,
} from 'src/app/core/utils/helpers';

@Component({
  selector: 'app-private-key-address-modal',
  templateUrl: './private-key-address-modal.component.html',
  styleUrls: ['./private-key-address-modal.component.scss']
})
export class PrivateKeyAddressModalComponent {
  @Input() public publicKeyOrAddress: string;
  @Input() public privateKeyOrAddress: string;
  @Input() public isKey: boolean = false;
  @Input() public isEtherLinkAddress: boolean = false;
  public convertToEthereumAddress = convertECDSAPublicKeyToEthereumAddress;
  public convertToEtherLinkAddress = convertECDSAPublicKeyToEtherLinkAddress;
  public publicElCopyTitle: string;
  public privateElCopyTitle: string;

  constructor(
    public activeModal: NgbActiveModal,
  ) {
    this.publicElCopyTitle = 'Click to copy public ' + this.isKey
      ? 'key'
      : 'address';
    this.privateElCopyTitle = 'Click to copy secret ' + this.isKey
      ? 'key'
      : 'address';
  }

  copy(keyOrAddress: string, element) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = keyOrAddress;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    element.classList.add('clicked');
    setTimeout(() => {element.classList.remove('clicked')},2000);
  }

  minifyHex(key: string) {
    return '0x' + key.slice(0, 30) + '...' + key.slice(-16);
  }
}
