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

export {
  minifyPublicKey,
  modifyPemPrefixAndSuffix
};
