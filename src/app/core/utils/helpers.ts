function minifyPublicKey(publicKey: string) {
  if (publicKey.length > 30) {
    publicKey = publicKey.substring(0, 20) + '...' + publicKey.substring(publicKey.length - 10);
    return publicKey;
  }

  return publicKey;
}

function modifyPemPrefixAndSuffix(pem: string): string {
  const RSA = 'RSA';
  const BEGIN = 'BEGIN';
  const END = 'END';
  const indexOfBegin = pem.indexOf(BEGIN);
  const indexOfEnd = pem.indexOf(END);

  return [
    pem.slice(0, indexOfBegin + BEGIN.length + 1),
    RSA,
    pem.slice(indexOfBegin + BEGIN.length, indexOfEnd + END.length + 1),
    RSA,
    pem.slice(indexOfEnd + END.length)
  ].join('');
}

function convertPemToBinary(pem) {
  var lines = pem.split('\n');
  var encoded = '';
  for(var i = 0;i < lines.length;i++) {
    if (lines[i].trim().length > 0 &&
        lines[i].indexOf('-BEGIN RSA PRIVATE KEY-') < 0 &&
        lines[i].indexOf('-BEGIN RSA PUBLIC KEY-') < 0 &&
        lines[i].indexOf('-END RSA PRIVATE KEY-') < 0 &&
        lines[i].indexOf('-END RSA PUBLIC KEY-') < 0) {
      encoded += lines[i].trim();
    }
  }

  return base64StringToArrayBuffer(encoded);
}

function base64StringToArrayBuffer(b64str) {
  var byteStr = atob(b64str);
  var bytes = new Uint8Array(byteStr.length);
  
  for (var i = 0; i < byteStr.length; i++) {
    bytes[i] = byteStr.charCodeAt(i);
  }

  return bytes.buffer;
}

function arrayBufferToBase64String(arrayBuffer) {
  var byteArray = new Uint8Array(arrayBuffer);
  var byteString = '';

  for (var i=0; i<byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }

  return btoa(byteString);
}

export {
  minifyPublicKey,
  modifyPemPrefixAndSuffix,
  convertPemToBinary,
  arrayBufferToBase64String
};
