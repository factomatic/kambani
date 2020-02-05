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
  chrome.storage.sync.get(['fctAddressesRequestWhitelistedDomains', 'fctAddresses'], function(result) {
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
        addFCTAddressesChangesListener();
      } else {
        chrome.runtime.sendMessage({type: 'receiveApprovalRequest', requestType: 'FCT', from: requestOrigin},
          function(response) {
            if (response.success) {
              window.dispatchEvent(fctAddressesEvent);
              addFCTAddressesChangesListener();
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
  chrome.storage.sync.get(['ecAddressesRequestWhitelistedDomains', 'ecAddresses'], function(result) {
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
        addECAddressesChangesListener();
      } else {
        chrome.runtime.sendMessage({type: 'receiveApprovalRequest', requestType: 'EC', from: requestOrigin},
          function(response) {
            if (response.success) {
              window.dispatchEvent(ecAddressesEvent);
              addECAddressesChangesListener();
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

function addFCTAddressesChangesListener() {
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.fctAddresses) {
      let fctAddressesOldValue = changes.fctAddresses.oldValue;
      let fctAddressesNewValue = changes.fctAddresses.newValue;
      
      if (fctAddressesOldValue == undefined) {
        fctAddressesOldValue = []
      }
  
      if (fctAddressesNewValue == undefined) {
        fctAddressesNewValue = []
      }
  
      if (fctAddressesOldValue.length < fctAddressesNewValue.length) {
        const oldFctAddresses = fctAddressesOldValue.map(addr => JSON.stringify(addr));
        const addedFctAddress = fctAddressesNewValue.filter(addr => !oldFctAddresses.includes(JSON.stringify(addr)));
  
        const event = new CustomEvent('FCTAddressesChanged', {
          detail: {
            "added": addedFctAddress
          }
        });
  
        window.dispatchEvent(event);
      } else if (fctAddressesOldValue.length > fctAddressesNewValue.length) {
        const currentFctAddresses = fctAddressesNewValue.map(addr => JSON.stringify(addr));
        const removedFctAddress = fctAddressesOldValue.filter(addr => !currentFctAddresses.includes(JSON.stringify(addr)));
  
        const event = new CustomEvent('FCTAddressesChanged', {
          detail: {
            "removed": removedFctAddress
          }
        });
  
        window.dispatchEvent(event);
      } else {
        const oldFctAddresses = fctAddressesOldValue.map(addr => JSON.stringify(addr));
        const addedFctAddress = fctAddressesNewValue.filter(addr => !oldFctAddresses.includes(JSON.stringify(addr)));
  
        const currentFctAddresses = fctAddressesNewValue.map(addr => JSON.stringify(addr));
        const removedFctAddress = fctAddressesOldValue.filter(addr => !currentFctAddresses.includes(JSON.stringify(addr)));
  
        const event = new CustomEvent('FCTAddressesChanged', {
          detail: {
            "added": addedFctAddress,
            "removed": removedFctAddress
          }
        });
  
        window.dispatchEvent(event);
      }
    }
  });
}

function addECAddressesChangesListener() {
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.ecAddresses) {
      let ecAddressesOldValue = changes.ecAddresses.oldValue;
      let ecAddressesNewValue = changes.ecAddresses.newValue;
  
      if (ecAddressesOldValue == undefined) {
        ecAddressesOldValue = []
      }
  
      if (ecAddressesNewValue == undefined) {
        ecAddressesNewValue = []
      }
  
      if (ecAddressesOldValue.length < ecAddressesNewValue.length) {
        const oldEcAddresses = ecAddressesOldValue.map(addr => JSON.stringify(addr));
        const addedEcAddress = ecAddressesNewValue.filter(addr => !oldEcAddresses.includes(JSON.stringify(addr)));
  
        const event = new CustomEvent('ECAddressesChanged', {
          detail: {
            "added": addedEcAddress
          }
        });
  
        window.dispatchEvent(event);
      } else if (ecAddressesOldValue.length > ecAddressesNewValue.length) {
        const currentEcAddresses = ecAddressesNewValue.map(addr => JSON.stringify(addr));
        const removedEcAddress = ecAddressesOldValue.filter(addr => !currentEcAddresses.includes(JSON.stringify(addr)));
  
        const event = new CustomEvent('ECAddressesChanged', {
          detail: {
            "removed": removedEcAddress
          }
        });
  
        window.dispatchEvent(event);
      } else {
        const oldEcAddresses = ecAddressesOldValue.map(addr => JSON.stringify(addr));
        const addedEcAddress = ecAddressesNewValue.filter(addr => !oldEcAddresses.includes(JSON.stringify(addr)));
  
        const currentEcAddresses = ecAddressesNewValue.map(addr => JSON.stringify(addr));
        const removedEcAddress = ecAddressesOldValue.filter(addr => !currentEcAddresses.includes(JSON.stringify(addr)));
  
        const event = new CustomEvent('ECAddressesChanged', {
          detail: {
            "added": addedEcAddress,
            "removed": removedEcAddress
          }
        });
  
        window.dispatchEvent(event);
      }
    }
  });
}