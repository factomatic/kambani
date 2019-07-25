import { sha256 } from 'js-sha256';
import { sha512 } from 'js-sha512';

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

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
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

function toHexString(byteArray) {
  return Array.from(byteArray, function (byte: any) {
    // tslint:disable-next-line:no-bitwise
    return ((byte & 0xFF).toString(16)).padStart(2, '0');
  }).join('');
}

function calculateChainId(extIds) {
  const extIdsHashBytes = extIds.reduce(function (total, currentExtId) {
    const extIdHash = sha256.create();
    extIdHash.update(currentExtId);
    return total.concat(extIdHash.array());
  }, []);

  const fullHash = sha256.create();
  fullHash.update(extIdsHashBytes);

  return fullHash.hex();
}

function calculateSha512(content: string): string {
  const hash = sha512.create();
  hash.update(content);
  return hash.hex();
}

async function exportPemKeys(keys) {
  const pubKey = await exportRSAPublicKey(keys);
  const privKey = await exportRSAPrivateKey(keys);

  return { publicKey: pubKey, privateKey: privKey };
}

async function exportRSAPublicKey(keys) {
  const spki = await window.crypto.subtle.exportKey('spki', keys.publicKey);
  return convertBinaryToPem(spki, "RSA PUBLIC KEY");
}

async function exportRSAPrivateKey(keys) {
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keys.privateKey);
  return convertBinaryToPem(pkcs8, "RSA PRIVATE KEY");
}

function convertBinaryToPem(binaryData, label) {
  const base64Cert = arrayBufferToBase64String(binaryData);
  let pemCert = "-----BEGIN " + label + "-----\r\n";
  let nextIndex = 0;

  while (nextIndex < base64Cert.length) {
    if (nextIndex + 64 <= base64Cert.length) {
      pemCert += base64Cert.substr(nextIndex, 64) + "\r\n";
    } else {
      pemCert += base64Cert.substr(nextIndex) + "\r\n";
    }

    nextIndex += 64;
  }

  pemCert += "-----END " + label + "-----\r\n";
  return pemCert;
}

export {
  minifyPublicKey,
  modifyPemPrefixAndSuffix,
  convertPemToBinary,
  arrayBufferToBase64String,
  toHexString,
  calculateChainId,
  calculateSha512,
  capitalize,
  exportPemKeys
};
