window.addEventListener('GetAllAddresses', (event) => {
  chrome.storage.sync.get(['fctAddresses', 'ecAddresses'], function(result) {
    const event = new CustomEvent('AllAddresses', {
      detail: {
        "fct": result.fctAddresses,
        "ec": result.ecAddresses
      }
    });

    window.dispatchEvent(event);
  });
});

window.addEventListener('GetFCTAddresses', (event) => {
  chrome.storage.sync.get(['fctAddresses'], function(result) {
    const event = new CustomEvent('FCTAddresses', {
      detail: result.fctAddresses
    });

    window.dispatchEvent(event);
  });
});

window.addEventListener('GetECAddresses', (event) => {
  chrome.storage.sync.get(['ecAddresses'], function(result) {
    const event = new CustomEvent('ECAddresses', {
      detail: result.ecAddresses
    });

    window.dispatchEvent(event);
  });
});
  
chrome.storage.onChanged.addListener(function(changes) {
  if (changes.fctAddresses) {
    const fctAddressesOldValue = changes.fctAddresses.oldValue;
    const fctAddressesNewValue = changes.fctAddresses.newValue;

    if (fctAddressesOldValue.length < fctAddressesNewValue.length) {
      const addedFctAddress = fctAddressesNewValue.filter(addr => !fctAddressesOldValue.includes(addr))[0];

      const event = new CustomEvent('FCTAddressesChanged', {
        detail: {
          "added": addedFctAddress
        }
      });

      window.dispatchEvent(event);
    } else {
      const removedFctAddress = fctAddressesOldValue.filter(addr => !fctAddressesNewValue.includes(addr))[0];

      const event = new CustomEvent('FCTAddressesChanged', {
        detail: {
          "removed": removedFctAddress
        }
      });

      window.dispatchEvent(event);
    }
  } else if (changes.ecAddresses) {
    const ecAddressesOldValue = changes.ecAddresses.oldValue;
    const ecAddressesNewValue = changes.ecAddresses.newValue;

    if (ecAddressesOldValue.length < ecAddressesNewValue.length) {
      const addedEcAddress = ecAddressesNewValue.filter(addr => !ecAddressesOldValue.includes(addr))[0];

      const event = new CustomEvent('ECAddressesChanged', {
        detail: {
          "added": addedEcAddress
        }
      });

      window.dispatchEvent(event);
    } else {
      const removedEcAddress = ecAddressesOldValue.filter(addr => !ecAddressesNewValue.includes(addr))[0];

      const event = new CustomEvent('ECAddressesChanged', {
        detail: {
          "removed": removedEcAddress
        }
      });

      window.dispatchEvent(event);
    }
  }
});
  