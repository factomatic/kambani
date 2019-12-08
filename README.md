# Kambani

Kambani is a Chrome extension, allowing any website to send a request for digitally signing an arbitrary message in
the browser. The extension provides the following functionality:

* creation of encrypted vaults for storing private keys, using the AES-GCM encryption algorithm
* support for FCT, EC keys and digital identities based on [W3C DID](https://github.com/bi-foundation/FIS/blob/feature/DID/FIS/DID.md)
* ECDSA digital signatures over the `secp256k1` (a.k.a. Bitcoin) elliptic curve
* EdDSA digital signatures over the `edwards25519` curve, as specified in [RFC8032](https://tools.ietf.org/html/rfc8032)
* RSA digital signatures
* paper backups for vaults
* importing of individual (unencrypted) private FCT & EC keys
* handling of multiple signing requests from different websites

All private keys are stored encrypted in-memory and at-rest. Decryption of the private keys is only done when signing an
incoming message, or when importing them from an encrypted file.

## Build
Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.
Run `ng build --prod` for a production build. The build artifacts will be stored in the `dist/` directory.

## Development mode
There are two ways in which the application can be accessed during development and for local tests.

### Standalone Angular app
Run `ng serve --aot` for a dev server and navigate to `http://localhost:4200/`. This will provide you with a version of
Kambani as a standalone web application and allows testing of different components, such as importing keys and
creating and backing up a vault.

This mode is not recommeneded for emulating signing of requests.

### Local installation of the extension
To install the extension locally:

1. Checkout the repository
1. Run `npm install`
1. Run `ng build --prod` from the project root directory
1. Open a Chrome browser and go to the special URL `chrome://extensions`
1. Make sure Developer Mode is switched on in the top-right corner
1. Click on the `Load Unpacked` link in the top-left corner
1. Choose the `dist/kambani` folder in the project root directory

The plugin should now be visible in your Chrome browser and be listed on the `chrome://extensions` page

## Integration into existing websites
Coming soon™
