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

registerKeysOrAddressesEventListener('GetFCTAddresses', 'FCTAddresses', 'FCT', 'fctAddressesRequestWhitelistedDomains', 'fctAddresses', 'FCTAddressesChanged');
registerKeysOrAddressesEventListener('GetECAddresses', 'ECAddresses', 'EC', 'ecAddressesRequestWhitelistedDomains', 'ecAddresses', 'ECAddressesChanged');
registerKeysOrAddressesEventListener('GetBlockSigningKeys', 'BlockSigningKeys', 'BlockSigningKey', 'blockSigningKeysRequestWhitelistedDomains', 'blockSigningKeys', 'BlockSigningKeysChanged');

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

function registerKeysOrAddressesEventListener(eventName, responseEventName, requestType, whitelistedDomainsPropertyName, keysOrAddressesPropertyName, changedEventName) {
  window.addEventListener(eventName, (event) => {
    chrome.storage.local.get([whitelistedDomainsPropertyName, keysOrAddressesPropertyName], function(result) {
      if (result[keysOrAddressesPropertyName] === undefined) {
        /*
          Return { success: false } if the property in chrome storage is undefined.
          This should happen only if there is no vault created by the user.
        */
        window.dispatchEvent(new CustomEvent(responseEventName, { detail: { success: false } }));
      } else {
        let responseEvent = new CustomEvent(responseEventName, {
          detail: { success: true, [keysOrAddressesPropertyName]: result[keysOrAddressesPropertyName] }
        });
    
        const requestOrigin = event.target.origin;
        const whitelistedDomains = result[whitelistedDomainsPropertyName];
        if (whitelistedDomains !== undefined && whitelistedDomains.includes(requestOrigin)) {
          window.dispatchEvent(responseEvent);
          addAddressesChangesListener(keysOrAddressesPropertyName, changedEventName);
        } else {
          chrome.runtime.sendMessage({type: 'receiveApprovalRequest', requestType: requestType, from: requestOrigin},
            function(response) {
              if (response.success) {
                window.dispatchEvent(responseEvent);
                addAddressesChangesListener(keysOrAddressesPropertyName, changedEventName);
              } else {
                responseEvent = new CustomEvent(responseEventName, {detail: response});
                window.dispatchEvent(responseEvent);
              }
            }
          );
        }
      }
    });
  });
}

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