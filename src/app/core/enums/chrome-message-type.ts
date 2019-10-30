export enum ChromeMessageType {
  PendingRequestsCount = 'pendingRequestsCount',
  GetContentToSign = 'getContentToSign',
  CancelSigning = 'cancelSigning',
  SkipSigning = 'skipSigning',
  SendSignedDataBack = 'sendSignedDataBack',
  RestoreVaultRequest = 'restoreVaultRequest',
  ManageDidsRequest = 'manageDidsRequest',
  ManageFactomAddressesRequest = 'manageFactomAddressesRequest',
  CheckRequests = 'checkRequests',
  NewTabOpen = 'newTabOpen'
}
