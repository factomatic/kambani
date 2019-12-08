const NEW_TAB_OPEN = 'newTabOpen';
const RESTORE_VAULT_REQUEST = 'restoreVaultRequest';
const MANAGE_DIDS_REQUEST = 'manageDidsRequest';
const MANAGE_FACTOM_ADDRESSES_REQUEST = 'manageFactomAddressesRequest';
const CHECK_REQUESTS = 'checkRequests';
const PENDING_SIGNING_REQUESTS_COUNT = 'pendingSigningRequestsCount';
const GET_SIGNING_REQUEST = 'getSigningRequest';
const CANCEL_SIGNING_REQUEST = 'cancelSigningRequest';
const SKIP_SIGNING_REQUEST = 'skipSigningRequest';
const SEND_SIGNING_REQUEST_RESPONSE = 'sendSigningRequestResponse';
const RECEIVE_SIGNING_REQUEST = 'receiveSigningRequest';
const INVALID_REQUEST_RESPONSE = 'Invalid request!';
const DID_KEY_REQUEST_TYPE = 'didKey';
const MANAGEMENT_KEY_REQUEST_TYPE = 'managementKey';
const FCT_REQUEST_TYPE = 'fct';
const EC_REQUEST_TYPE = 'ec';
const BASIC_REQUEST = 'basic';
const FCT_BURNING_REQUEST = 'fctBurning';
const PEGNET_TRANSACTION_REQUEST = 'pegnetTransaction';

(function() {
  let signingRequests = [];
  let responseCallbacks = [];
  let currentSigningRequestIndex = -1;
  let restoreVaultRequested = false;
  let manageDidsRequested = false;
  let manageFactomAddressesRequested = false;

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
      case CHECK_REQUESTS:
        response({
          restoreVaultRequested: restoreVaultRequested,
          manageDidsRequested: manageDidsRequested,
          manageFactomAddressesRequested: manageFactomAddressesRequested
        });
        break;
      case NEW_TAB_OPEN:
        restoreVaultRequested = false;
        manageDidsRequested = false;
        manageFactomAddressesRequested = false;
        break;
      case RECEIVE_SIGNING_REQUEST:
        if (isValidRequest(msg.content)) {
          signingRequests.push({
            content: msg.content,
            from: sender.url
          });

          responseCallbacks.push(response);

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
        if(responseCallbacks.length > 0) {
          const responseCallback = responseCallbacks[currentSigningRequestIndex];
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
          responseCallbacks.splice(currentSigningRequestIndex, 1);
          if (signingRequests.length === 0) {
            currentSigningRequestIndex = -1;
          }
        }
        break;
      case SKIP_SIGNING_REQUEST:
        currentSigningRequestIndex--;
        break;
      case SEND_SIGNING_REQUEST_RESPONSE:
        if(responseCallbacks.length > 0) {
          const responseCallback = responseCallbacks[currentSigningRequestIndex];
          responseCallback({
            success: true,
            ...msg.data
          });

          chrome.browserAction.getBadgeText({}, function(result) {
            const number = parseInt(result) - 1;
            chrome.browserAction.setBadgeText({text: number.toString()});
          });

          signingRequests.splice(currentSigningRequestIndex, 1);
          responseCallbacks.splice(currentSigningRequestIndex, 1);
          if (signingRequests.length === 0) {
            currentSigningRequestIndex = -1;
          }
        }
        break;
      default:
        response(INVALID_REQUEST_RESPONSE);
        break;
    }
  });
}());

function isValidRequest (requestContent) {
  if (requestContent.requestId == undefined || requestContent.requestType == undefined || requestContent.keyType == undefined || requestContent.data == undefined) {
    return false;
  }

  const requestTypes = [BASIC_REQUEST, FCT_BURNING_REQUEST, PEGNET_TRANSACTION_REQUEST];
  if (!requestTypes.includes(requestContent.requestType)) {
    return false;
  }
  
  const requestKeyTypes = [DID_KEY_REQUEST_TYPE, MANAGEMENT_KEY_REQUEST_TYPE, FCT_REQUEST_TYPE, EC_REQUEST_TYPE];
  if (!requestKeyTypes.includes(requestContent.keyType)) {
    return false;
  }

  if (requestContent.txType
    && (requestContent.requestType !== PEGNET_TRANSACTION_REQUEST || !["conversion", "transfer"].includes(requestContent.txType))) {
    return false;
  }

  if (requestContent.did) {
    if (requestContent.requestType !== BASIC_REQUEST
      || requestContent.keyType == FCT_REQUEST_TYPE
      || requestContent.keyType == EC_REQUEST_TYPE) {
      return false;
    }

    if (!/did:factom:[a-f0-9]{64}/.test(requestContent.did)) {
      return false;
    }
  }

  if (requestContent.keyIdentifier) {
    if (requestContent.keyType == FCT_REQUEST_TYPE) {
      if (requestContent.keyIdentifier.substring(0, 2) !== 'FA') {
        return false;
      }
    } else if (requestContent.keyType == EC_REQUEST_TYPE) {
      if (requestContent.keyIdentifier.substring(0, 2) !== 'EC') {
        return false;
      }
    } else {
      if (!requestContent.did) {
        return false;
      }
    }
  }

  if ([FCT_BURNING_REQUEST, PEGNET_TRANSACTION_REQUEST].includes(requestContent.requestType)) {
    if (requestContent.txMetadata == undefined || requestContent.keyType !== FCT_REQUEST_TYPE) {
      return false;
    }
  } else {
    if (requestContent.txMetadata !== undefined) {
      return false;
    }
  }

  return true;
}
