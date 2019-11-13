export enum ChromeMessageType {
  PendingSigningRequestsCount = 'pendingSigningRequestsCount',
  GetSigningRequest = 'getSigningRequest',
  CancelSigningRequest = 'cancelSigningRequest',
  SkipSigningRequest = 'skipSigningRequest',
  SendSigningRequestResponse = 'sendSigningRequestResponse',
  RestoreVaultRequest = 'restoreVaultRequest',
  ManageDidsRequest = 'manageDidsRequest',
  ManageFactomAddressesRequest = 'manageFactomAddressesRequest',
  CheckRequests = 'checkRequests',
  NewTabOpen = 'newTabOpen'
}
