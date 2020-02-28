import * as base58 from 'bs58';
import * as keccak256 from 'keccak256';
import * as elliptic from 'elliptic';
import { sha256 } from 'js-sha256';

function minifyPublicKey(publicKey: string) {
  if (publicKey.length > 40) {
    publicKey = publicKey.substring(0, 30) + '...' + publicKey.substring(publicKey.length - 10);
    return publicKey;
  }

  return publicKey;
}

function minifyDid(didId: string) {
  return didId.substring(0, 30) + '...' + didId.substring(didId.length - 10);
}

function minifyAddress(address: string) {
  return address.substring(0, 20) + '...' + address.substring(address.length - 10);
}

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function convertPemToBinary(pem) {
  var lines = pem.split('\n');
  var encoded = '';
  for(var i = 0;i < lines.length;i++) {
    if (lines[i].trim().length > 0 &&
        lines[i].indexOf('-BEGIN PRIVATE KEY-') < 0 &&
        lines[i].indexOf('-BEGIN PUBLIC KEY-') < 0 &&
        lines[i].indexOf('-END PRIVATE KEY-') < 0 &&
        lines[i].indexOf('-END PUBLIC KEY-') < 0) {
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

function calculateDoubleSha256(content) {
  const hash = sha256.update(content);
  const hash2 = sha256.update(hash.digest());
  return hash2.digest();
}

async function exportPemKeys(keys) {
  const pubKey = await exportRSAPublicKey(keys);
  const privKey = await exportRSAPrivateKey(keys);

  return { publicKey: pubKey, privateKey: privKey };
}

async function exportRSAPublicKey(keys) {
  const spki = await window.crypto.subtle.exportKey('spki', keys.publicKey);
  return convertBinaryToPem(spki, "PUBLIC KEY");
}

async function exportRSAPrivateKey(keys) {
  const pkcs8 = await window.crypto.subtle.exportKey('pkcs8', keys.privateKey);
  return convertBinaryToPem(pkcs8, "PRIVATE KEY");
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

function downloadFile(fileContent: string, fileName: string) {
  const downloader = document.createElement('a');
  document.body.appendChild(downloader);

  const blob = new Blob([fileContent], { type: 'text/json' });
  const url = window.URL;
  const fileUrl = url.createObjectURL(blob);

  downloader.setAttribute('href', fileUrl);
  downloader.setAttribute('download', fileName);
  downloader.click();
}

function preProcessEncryptedBackupFile(encryptedFile: string) {
  const parsedFile = JSON.parse(encryptedFile);
  const newFile = {
    data: parsedFile.data,
    iv: parsedFile.encryptionAlgo.iv,
    salt: parsedFile.encryptionAlgo.salt
  };

  return JSON.stringify(newFile);
}

function postProcessEncryptedBackupFile(encryptedFile: string) {
  const parsedFile = JSON.parse(encryptedFile);
  const newFile: any = { };

  newFile.data = parsedFile.data;
  newFile.encryptionAlgo = {
    name: 'AES-GCM',
    iv: parsedFile.iv,
    salt: parsedFile.salt,
    tagLength: 128
  };

  return JSON.stringify(newFile, null, 2);
}

function generateBackupFileName() {
  const date = new Date();
  return `kambani-vault-backup-UTC--${date.toISOString()}.txt`;
}

function convertECDSAPublicKeyToEtherLinkAddress(publicKey: string) {
  const rcdBytes = Buffer.concat([Buffer.from('0e', 'hex'), Buffer.from(publicKey, 'hex')]);
  const prefix = Buffer.from('62f4', 'hex');
  const rcdHash = calculateDoubleSha256(rcdBytes);
  const checkSum = calculateDoubleSha256(Buffer.concat([prefix, Buffer.from(rcdHash)])).slice(0, 4);
  return base58.encode(Buffer.concat([prefix, Buffer.from(rcdHash), Buffer.from(checkSum)]));
}

function convertECDSAPublicKeyToEthereumAddress(publicKey: string) {
  const publicKeyBytes = Buffer.from(publicKey, 'hex');
  return '0x' + keccak256(publicKeyBytes).slice(12).toString('hex');
}

function generateRandomEtherLinkKeyPair() {
  const curve = elliptic.ec('secp256k1');
  const keyPair = curve.genKeyPair();

  return {
    // Remove the first 2 bytes signifying an uncompressed ECDSA public key 
    public: keyPair.getPublic('hex').slice(2),
    private: keyPair.getPrivate('hex')
  }
}

export {
  minifyPublicKey,
  minifyDid,
  minifyAddress,
  convertPemToBinary,
  toHexString,
  calculateChainId,
  calculateDoubleSha256,
  capitalize,
  exportPemKeys,
  downloadFile,
  preProcessEncryptedBackupFile,
  postProcessEncryptedBackupFile,
  generateBackupFileName,
  convertECDSAPublicKeyToEtherLinkAddress,
  convertECDSAPublicKeyToEthereumAddress,
  generateRandomEtherLinkKeyPair
};
