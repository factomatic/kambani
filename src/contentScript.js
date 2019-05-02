window.addEventListener('ContentToSign', (event) => {
  chrome.runtime.sendMessage({type: 'receiveContentToSign', content: event.data},
    function(response) {
      var event = new CustomEvent('SigningResult', {data: response});
        window.dispatchEvent(event);
    }
  );
});
