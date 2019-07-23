import { NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

export class ModalOptions implements NgbModalOptions {
  // alternatively, specify 'static' for a backdrop which doesn't close the modal on click.
  backdrop?: boolean | 'static';

  // an element to which to attach newly opened modal windows.
  container?: string;

  // whether to close the modal when escape key is pressed (true by default).
  keyboard?: boolean;

  // size of a new modal window. Use the Enumeration DialogSizeTypes
  size?: any;

  // custom class to append to the modal window
  windowClass?: string;
}
