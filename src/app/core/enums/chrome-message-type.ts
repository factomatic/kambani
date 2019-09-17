export enum ChromeMessageType {
  PendingRequestsCount = 'pendingRequestsCount',
  GetContentToSign = 'getContentToSign',
  CancelSigning = 'cancelSigning',
  SkipSigning = 'skipSigning',
  SendSignedDataBack = 'sendSignedDataBack',
  ImportKeysRequest = 'importKeysRequest',
  RestoreVaultRequest = 'restoreVaultRequest',
  ManageDidsRequest = 'manageDidsRequest',
  CheckRequests = 'checkRequests',
  NewTabOpen = 'newTabOpen'
}
