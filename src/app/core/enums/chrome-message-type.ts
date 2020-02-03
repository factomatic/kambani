export enum ChromeMessageType {
  PendingSigningRequestsCount = 'pendingSigningRequestsCount',
  GetSigningRequest = 'getSigningRequest',
  CancelSigningRequest = 'cancelSigningRequest',
  SkipSigningRequest = 'skipSigningRequest',
  SendSigningRequestResponse = 'sendSigningRequestResponse',
  RestoreVaultRequest = 'restoreVaultRequest',
  ManageDidsRequest = 'manageDidsRequest',
  ManageFactomAddressesRequest = 'manageFactomAddressesRequest',
  SettingsRequest = 'settingsRequest',
  CheckRequests = 'checkRequests',
  NewTabOpen = 'newTabOpen',
  ApprovalRequestsCount = 'approvalRequestsCount',
  GetApprovalRequest = 'getApprovalRequest',
  SendApprovalRequestResponse = 'sendApprovalRequestResponse'
}
