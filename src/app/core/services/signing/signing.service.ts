import { Injectable, Output, EventEmitter } from '@angular/core';

@Injectable()
export class SigningService {
  private pendingRequestsCount: number;
  @Output() change: EventEmitter<number> = new EventEmitter();

  updatePendingRequestsCount(pendingRequestsCount: number) {
    this.pendingRequestsCount = pendingRequestsCount;
    this.change.emit(this.pendingRequestsCount);
  }
}
