window.addEventListener('IsKambaniInstalled', () => {
  const responseEvent = new CustomEvent('KambaniInstalled');
  window.dispatchEvent(responseEvent);
});

window.addEventListener('SigningRequest', (event) => {
  chrome.runtime.sendMessage({type: 'receiveSigningRequest', content: event.detail},
    function(response) {
      const signingResponseEvent = new CustomEvent('SigningResponse', {detail: response});
      window.dispatchEvent(signingResponseEvent);
    }
  );
});

window.addEventListener('GetFCTAddresses', (event) => {
  chrome.storage.local.get(['fctAddressesRequestWhitelistedDomains', 'fctAddresses'], function(result) {
    if (result.fctAddresses === undefined) {
      /*
        Return { success: false } if fctAddresses property in chrome storage is undefined.
        This should happen only if there is no vault created by the user.
      */
      window.dispatchEvent(new CustomEvent('FCTAddresses', { detail: { success: false } }));
    } else {
      let fctAddressesEvent = new CustomEvent('FCTAddresses', {
        detail: { success: true, fctAddresses: result.fctAddresses }
      });
  
      const requestOrigin = event.target.origin;
      const whitelistedDomains = result.fctAddressesRequestWhitelistedDomains;
      if (whitelistedDomains !== undefined && whitelistedDomains.includes(requestOrigin)) {
        window.dispatchEvent(fctAddressesEvent);
        addAddressesChangesListener('fctAddresses', 'FCTAddressesChanged');
      } else {
        chrome.runtime.sendMessage({type: 'receiveApprovalRequest', requestType: 'FCT', from: requestOrigin},
          function(response) {
            if (response.success) {
              window.dispatchEvent(fctAddressesEvent);
              addAddressesChangesListener('fctAddresses', 'FCTAddressesChanged');
            } else {
              fctAddressesEvent = new CustomEvent('FCTAddresses', {detail: response});
              window.dispatchEvent(fctAddressesEvent);
            }
          }
        );
      }
    }
  });
});

window.addEventListener('GetECAddresses', (event) => {
  chrome.storage.local.get(['ecAddressesRequestWhitelistedDomains', 'ecAddresses'], function(result) {
    if (result.ecAddresses === undefined) {
      /*
        Return { success: false } if ecAddresses property in chrome storage is undefined.
        This should happen only if there is no vault created by the user.
      */
      window.dispatchEvent(new CustomEvent('ECAddresses', { detail: { success: false } }));
    } else {
      let ecAddressesEvent = new CustomEvent('ECAddresses', {
        detail: { success: true, ecAddresses: result.ecAddresses }
      });
  
      const requestOrigin = event.target.origin;
      const whitelistedDomains = result.ecAddressesRequestWhitelistedDomains;
      if (whitelistedDomains !== undefined && whitelistedDomains.includes(requestOrigin)) {
        window.dispatchEvent(ecAddressesEvent);
        addAddressesChangesListener('ecAddresses', 'ECAddressesChanged');
      } else {
        chrome.runtime.sendMessage({type: 'receiveApprovalRequest', requestType: 'EC', from: requestOrigin},
          function(response) {
            if (response.success) {
              window.dispatchEvent(ecAddressesEvent);
              addAddressesChangesListener('ecAddresses', 'ECAddressesChanged');
            } else {
              ecAddressesEvent = new CustomEvent('ECAddresses', {detail: response});
              window.dispatchEvent(ecAddressesEvent);
            }
          }
        );
      }
    }
  });
});

window.addEventListener('GetPegnetAddresses', (event) => {
  chrome.storage.local.get([
    'fctAddressesRequestWhitelistedDomains',
    'etherLinkAddressesRequestWhitelistedDomains',
    'fctAddresses',
    'etherLinkAddresses'
  ], function(result) {
    if (result.fctAddresses === undefined && result.etherLinkAddresses === undefined) {
      /*
        Return { success: false } if fctAddresses and etherLinkAddresses properties in chrome storage are undefined.
        This should happen only if there is no vault created by the user.
      */
      window.dispatchEvent(new CustomEvent('PegnetAddresses', { detail: { success: false } }));
    } else {
      let pegnetAddressesEvent = new CustomEvent('PegnetAddresses', {
        detail: { success: true, fctAddresses: result.fctAddresses, etherLinkAddresses: result.etherLinkAddresses }
      });
  
      const requestOrigin = event.target.origin;
      const etherLinkWhitelistedDomains = result.etherLinkAddressesRequestWhitelistedDomains;
      const fctWhitelistedDomains = result.fctAddressesRequestWhitelistedDomains;
      if (etherLinkWhitelistedDomains !== undefined
        && fctWhitelistedDomains !== undefined
        && etherLinkWhitelistedDomains.includes(requestOrigin)
        && fctWhitelistedDomains.includes(requestOrigin)) {
        window.dispatchEvent(pegnetAddressesEvent);
        addAddressesChangesListener('etherLinkAddresses', 'EtherLinkAddressesChanged');
        addAddressesChangesListener('fctAddresses', 'FCTAddressesChanged');
      } else {
        chrome.runtime.sendMessage({type: 'receiveApprovalRequest', requestType: 'Pegnet', from: requestOrigin},
          function(response) {
            if (response.success) {
              window.dispatchEvent(pegnetAddressesEvent);
              addAddressesChangesListener('etherLinkAddresses', 'EtherLinkAddressesChanged');
              addAddressesChangesListener('fctAddresses', 'FCTAddressesChanged');
            } else {
              pegnetAddressesEvent = new CustomEvent('PegnetAddresses', {detail: response});
              window.dispatchEvent(pegnetAddressesEvent);
            }
          }
        );
      }
    }
  });
});

function addAddressesChangesListener(addressType, eventName) {
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes[addressType]) {
      let addressesOldValue = changes[addressType].oldValue;
      let addressesNewValue = changes[addressType].newValue;
      
      if (addressesOldValue == undefined) {
        addressesOldValue = []
      }
  
      if (addressesNewValue == undefined) {
        addressesNewValue = []
      }
  
      if (addressesOldValue.length < addressesNewValue.length) {
        const oldAddresses = addressesOldValue.map(addr => JSON.stringify(addr));
        const addedAddresses = addressesNewValue.filter(addr => !oldAddresses.includes(JSON.stringify(addr)));
  
        const event = new CustomEvent(eventName, {
          detail: {
            "added": addedAddresses
          }
        });
  
        window.dispatchEvent(event);
      } else if (addressesOldValue.length > addressesNewValue.length) {
        const currentAddresses = addressesNewValue.map(addr => JSON.stringify(addr));
        const removedAddresses = addressesOldValue.filter(addr => !currentAddresses.includes(JSON.stringify(addr)));
  
        const event = new CustomEvent(eventName, {
          detail: {
            "removed": removedAddresses
          }
        });
  
        window.dispatchEvent(event);
      } else {
        const oldAddresses = addressesOldValue.map(addr => JSON.stringify(addr));
        const addedAddresses = addressesNewValue.filter(addr => !oldAddresses.includes(JSON.stringify(addr)));
  
        const currentAddresses = addressesNewValue.map(addr => JSON.stringify(addr));
        const removedAddresses = addressesOldValue.filter(addr => !currentAddresses.includes(JSON.stringify(addr)));
  
        const event = new CustomEvent(eventName, {
          detail: {
            "added": addedAddresses,
            "removed": removedAddresses
          }
        });
  
        window.dispatchEvent(event);
      }
    }
  });
}