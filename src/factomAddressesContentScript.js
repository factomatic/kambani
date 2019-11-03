window.addEventListener('GetFactomAddresses', (event) => {
  chrome.storage.sync.get(['fctAddresses', 'ecAddresses'], function(result) {
    var event = new CustomEvent('ReceiveFactomAddresses', {
      detail: {
        'fctAddresses': result.fctAddresses,
        'ecAddresses': result.ecAddresses
      }
    });

    window.dispatchEvent(event);
  });
});
  
chrome.storage.onChanged.addListener(function(changes) {
  let changedAddresses = {};
  if (changes.fctAddresses) {
    changedAddresses['fctAddresses'] = changes.fctAddresses.newValue;
  }

  if (changes.ecAddresses) {
    changedAddresses['ecAddresses'] = changes.ecAddresses.newValue;
  }

  var event = new CustomEvent('ReceiveFactomAddresses', {
    detail: changedAddresses
  });

  window.dispatchEvent(event);
});
  