window.addEventListener('ContentToSign', (event) => {
  chrome.runtime.sendMessage({type: 'receiveContentToSign', content: event.detail},
    function(response) {
      var event = new CustomEvent('SigningResult', {detail: response});
      window.dispatchEvent(event);
    }
  );
});
