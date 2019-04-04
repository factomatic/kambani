export enum ChromeMessageType {
  PendingRequests = 'pendingRequests',
  NewRequestsReceived = 'newRequestsReceived',
  GetContentToSign = 'getContentToSign',
  CancelSigning = 'cancelSigning',
  SkipSigning = 'skipSigning',
  SendSignedDataBack = 'sendSignedDataBack'
}
