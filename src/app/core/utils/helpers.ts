function minifyPublicKey(publicKey: string) {
  if (publicKey.length > 30) {
    publicKey = publicKey.substring(0, 20) + '...' + publicKey.substring(publicKey.length - 10);
    return publicKey;
  }

  return publicKey;
}

export {
  minifyPublicKey
};
