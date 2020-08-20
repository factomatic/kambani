const NEW_TAB_OPEN = 'newTabOpen';
const RESTORE_VAULT_REQUEST = 'restoreVaultRequest';
const MANAGE_DIDS_REQUEST = 'manageDidsRequest';
const MANAGE_FACTOM_ADDRESSES_REQUEST = 'manageFactomAddressesRequest';
const MANAGE_KEYS_REQUEST = 'manageKeysRequest';
const SETTINGS_REQUEST = 'settingsRequest';
const CHECK_REQUESTS = 'checkRequests';
const PENDING_SIGNING_REQUESTS_COUNT = 'pendingSigningRequestsCount';
const GET_SIGNING_REQUEST = 'getSigningRequest';
const CANCEL_SIGNING_REQUEST = 'cancelSigningRequest';
const SKIP_SIGNING_REQUEST = 'skipSigningRequest';
const SEND_SIGNING_REQUEST_RESPONSE = 'sendSigningRequestResponse';
const RECEIVE_SIGNING_REQUEST = 'receiveSigningRequest';
const APPROVAL_REQUESTS_COUNT = 'approvalRequestsCount';
const GET_APPROVAL_REQUEST = 'getApprovalRequest';
const RECEIVE_APPROVAL_REQUEST = 'receiveApprovalRequest';
const SEND_APPROVAL_REQUEST_RESPONSE = 'sendApprovalRequestResponse';
const INVALID_REQUEST_RESPONSE = 'Invalid request!';
const DATA_REQUEST = 'data';
const PEGNET_REQUEST = 'pegnet';
const DID_KEY_TYPE = 'didKey';
const MANAGEMENT_KEY_TYPE = 'managementKey';
const FCT_KEY_TYPE = 'fct';
const EC_KEY_TYPE = 'ec';
const BLOCK_SIGNING_KEY_TYPE = 'blockSigningKey';
const BURN_TX_TYPE = 'burn';
const CONVERSION_TX_TYPE = 'conversion';
const TRANSFER_TX_TYPE = 'transfer';

(function() {
  let signingRequests = [];
  let signingRequestsCallbacks = [];
  let approvalRequests = [];
  let approvalRequestsCallbacks = [];
  let currentSigningRequestIndex = -1;
  let restoreVaultRequested = false;
  let manageDidsRequested = false;
  let manageFactomAddressesRequested = false;
  let manageKeysRequested = false;
  let settingsRequested = false;

  chrome.browserAction.setBadgeText({text: "0"});

  chrome.runtime.onMessage.addListener((msg, sender, response) => {
    switch (msg.type) {
      case RESTORE_VAULT_REQUEST:
        restoreVaultRequested = true;
        response({success: true});
        break;
      case MANAGE_DIDS_REQUEST:
        manageDidsRequested = true;
        response({success: true});
        break;
      case MANAGE_FACTOM_ADDRESSES_REQUEST:
        manageFactomAddressesRequested = true;
        response({success: true});
        break;
      case MANAGE_KEYS_REQUEST:
        manageKeysRequested = true;
        response({success: true});
        break;
      case SETTINGS_REQUEST:
        settingsRequested = true;
        response({success: true});
        break;
      case CHECK_REQUESTS:
        response({
          restoreVaultRequested: restoreVaultRequested,
          manageDidsRequested: manageDidsRequested,
          manageFactomAddressesRequested: manageFactomAddressesRequested,
          manageKeysRequested: manageKeysRequested,
          settingsRequested: settingsRequested,
          approvalRequests: approvalRequests.length > 0
        });
        break;
      case NEW_TAB_OPEN:
        restoreVaultRequested = false;
        manageDidsRequested = false;
        manageFactomAddressesRequested = false;
        manageKeysRequested = false;
        settingsRequested = false;
        break;
      case RECEIVE_SIGNING_REQUEST:
        if (isValidRequest(msg.content)) {
          signingRequests.push({
            content: msg.content,
            from: sender.url
          });

          signingRequestsCallbacks.push(response);
          currentSigningRequestIndex = -1;

          chrome.browserAction.getBadgeText({}, function(result) {
            const number = parseInt(result) + 1;
            chrome.browserAction.setBadgeText({text: number.toString()});
          });

          chrome.notifications.create({
            type: "basic",
            title: "Notification message",
            message: "New signing request received",
            iconUrl: "assets/kambani-logo.png"
          });

          return true;
        } else {
          response({
            success: false,
            requestId: msg.content.requestId
          });
        }
        break;
      case PENDING_SIGNING_REQUESTS_COUNT:
        response({
          pendingSigningRequestsCount: signingRequests.length,
        });
        break;
      case GET_SIGNING_REQUEST:
        if (signingRequests.length > 0) {
          if(currentSigningRequestIndex < 0 || currentSigningRequestIndex >= signingRequests.length) {
            currentSigningRequestIndex = signingRequests.length - 1;
          }

          response({
            success: true,
            signingRequest: signingRequests[currentSigningRequestIndex]
          });
        } else {
          response({
            success: false
          });
        }
        break;
      case CANCEL_SIGNING_REQUEST:
        if(signingRequestsCallbacks.length > 0) {
          const responseCallback = signingRequestsCallbacks[currentSigningRequestIndex];
          responseCallback({
            success: false,
            ...msg.data
          });

          chrome.browserAction.getBadgeText({}, function(result) {
            let number = parseInt(result) - 1;
            if (number < 0) number = 0;
            chrome.browserAction.setBadgeText({text: number.toString()});
          });

          signingRequests.splice(currentSigningRequestIndex, 1);
          signingRequestsCallbacks.splice(currentSigningRequestIndex, 1);
          if (signingRequests.length === 0) {
            currentSigningRequestIndex = -1;
          }
        }
        break;
      case SKIP_SIGNING_REQUEST:
        currentSigningRequestIndex--;
        break;
      case SEND_SIGNING_REQUEST_RESPONSE:
        if(signingRequestsCallbacks.length > 0) {
          const responseCallback = signingRequestsCallbacks[currentSigningRequestIndex];
          responseCallback({
            success: true,
            ...msg.data
          });

          chrome.browserAction.getBadgeText({}, function(result) {
            const number = parseInt(result) - 1;
            chrome.browserAction.setBadgeText({text: number.toString()});
          });

          signingRequests.splice(currentSigningRequestIndex, 1);
          signingRequestsCallbacks.splice(currentSigningRequestIndex, 1);
          if (signingRequests.length === 0) {
            currentSigningRequestIndex = -1;
          }
        }
        break;
      case APPROVAL_REQUESTS_COUNT:
        response({
          approvalRequestsCount: approvalRequests.length,
        });
        break;
      case GET_APPROVAL_REQUEST:
        if (approvalRequests.length > 0) {
          response({
            success: true,
            approvalRequest: approvalRequests[approvalRequests.length - 1]
          });
        } else {
          response({
            success: false
          });
        }
        break;
      case RECEIVE_APPROVAL_REQUEST:
        /*
          Checks if there is an existing approval request with the same type and origin
          -> if true deletes the old request and saves the new one
        */
        const existingRequestIndex = approvalRequests.findIndex(r => r.type === msg.requestType && r.from === msg.from);
        if (existingRequestIndex >= 0) {
          approvalRequests.splice(existingRequestIndex, 1);
          approvalRequestsCallbacks.splice(existingRequestIndex, 1);
        }

        approvalRequestsCallbacks.push(response);
        approvalRequests.push({
          from: msg.from,
          type: msg.requestType
        });

        chrome.notifications.create({
          type: "basic",
          title: "Notification message",
          message: "New Approval Request Received",
          iconUrl: "assets/kambani-logo.png"
        });
        return true;
      case SEND_APPROVAL_REQUEST_RESPONSE:
        if (approvalRequestsCallbacks.length > 0) {
          approvalRequests.pop();
          const responseCallback = approvalRequestsCallbacks.pop();
          responseCallback({
            success: msg.success
          });

          response({
            approvalRequestsCount: approvalRequests.length
          });
        }
        break;
      default:
        response(INVALID_REQUEST_RESPONSE);
        break;
    }
  });
}());

function isValidRequest (requestContent) {
  const requestType = requestContent.requestType;
  const requestInfo = requestContent.requestInfo;

  if (requestContent.requestId == undefined || requestType == undefined || requestInfo == undefined) {
    return false;
  }

  const requestTypes = [DATA_REQUEST, PEGNET_REQUEST];
  if (!requestTypes.includes(requestType)) {
    return false;
  }

  if (requestType == DATA_REQUEST) {
    const keyType = requestInfo.keyType;
    const keyIdentifier = requestInfo.keyIdentifier;
    const did = requestInfo.did;

    if (requestInfo.data == undefined) {
      return false;
    }
    
    const keyTypes = [DID_KEY_TYPE, MANAGEMENT_KEY_TYPE, FCT_KEY_TYPE, EC_KEY_TYPE, BLOCK_SIGNING_KEY_TYPE];
    if (!keyTypes.includes(keyType)) {
      return false;
    }
    
    if (keyIdentifier !== undefined) {
      if (keyType == FCT_KEY_TYPE) {
        if (keyIdentifier.substring(0, 2) !== 'FA') {
          return false;
        }
      } else if (keyType == EC_KEY_TYPE) {
        if (keyIdentifier.substring(0, 2) !== 'EC') {
          return false;
        }
      } else if (did == undefined && keyType !== BLOCK_SIGNING_KEY_TYPE) {
        return false;
      }
    }

    if (did !== undefined) {
      if (keyType == FCT_KEY_TYPE || keyType == EC_KEY_TYPE) {
        return false;
      }
  
      if (!/did:factom:[a-f0-9]{64}/.test(did)) {
        return false;
      }
    }
  }

  if (requestType == PEGNET_REQUEST) {
    const txType = requestInfo.txType;
    const inputAddress = requestInfo.inputAddress;
    const inputAmount = requestInfo.inputAmount;
    const inputAsset = requestInfo.inputAsset;
    const outputAddress = requestInfo.outputAddress;
    const outputAsset = requestInfo.outputAsset;

    if (txType == undefined || ![BURN_TX_TYPE, CONVERSION_TX_TYPE, TRANSFER_TX_TYPE].includes(txType)) {
      return false;
    }

    if (inputAddress == undefined || inputAddress.substring(0, 2) !== 'FA') {
      return false;
    }

    if (inputAmount == undefined || typeof inputAmount !== "number" || inputAmount <= 0) {
      return false;
    }

    if (txType !== BURN_TX_TYPE && inputAsset == undefined) {
      return false;
    }

    if (txType == CONVERSION_TX_TYPE && outputAsset == undefined) {
      return false;
    }

    if (txType == TRANSFER_TX_TYPE && (outputAddress == undefined || outputAddress.substring(0, 2) !== 'FA')) {
      return false;
    }
  }

  return true;
}
