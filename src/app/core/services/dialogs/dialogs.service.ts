import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { from } from 'rxjs';

import { ModalOptions } from '../../interfaces/dialogs/modal-options';
import { ModalSizeTypes } from '../../enums/modal-size-types';

@Injectable()
export class DialogsService {
  constructor(private modal: NgbModal) { }

  open(component: any, modalSize: ModalSizeTypes, message: string) {
    const modalOptions = this.createModalOptions(modalSize);
    modalOptions.keyboard = false;
    modalOptions.backdrop = 'static';

    const modalRef = this.modal.open(component, modalOptions);
    modalRef.componentInstance.message = message;

    return from(modalRef.result);
  }

  private createModalOptions(size: string): ModalOptions {
    const modalOptions = new ModalOptions();

    switch (size) {
      case ModalSizeTypes.Small: {
        modalOptions.size = ModalSizeTypes.Small;
        modalOptions.windowClass = 'modal-sm';
        break;
      }
      case ModalSizeTypes.Medium: {
        modalOptions.size = ModalSizeTypes.Large;
        modalOptions.windowClass = 'modal-md';
        break;
      }
      case ModalSizeTypes.ExtraLarge: {
        modalOptions.size = ModalSizeTypes.Large;
        modalOptions.windowClass = 'modal-xl';
        break;
      }
      case ModalSizeTypes.ExtraExtraLarge: {
        modalOptions.size = ModalSizeTypes.Large;
        modalOptions.windowClass = 'modal-xxl';
        break;
      }
      default: {
        modalOptions.size = size;
        break;
      }
    }

    return modalOptions;
  }
}
