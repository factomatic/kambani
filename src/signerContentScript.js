window.addEventListener('SigningRequest', (event) => {
  chrome.runtime.sendMessage({type: 'receiveSigningRequest', content: event.detail},
    function(response) {
      var event = new CustomEvent('SigningResponse', {detail: response});
      window.dispatchEvent(event);
    }
  );
});
