export enum ChromeMessageType {
  PendingRequestsCount = 'pendingRequestsCount',
  GetContentToSign = 'getContentToSign',
  CancelSigning = 'cancelSigning',
  SkipSigning = 'skipSigning',
  SendSignedDataBack = 'sendSignedDataBack',
  ImportKeysRequest = 'importKeysRequest',
  CheckImportKeysRequest = 'checkImportKeysRequest',
  NewTabOpen = 'newTabOpen'
}
