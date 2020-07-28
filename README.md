# Kambani

Kambani is a Chrome extension for cryptographic keys and digital identities management, tailored to the [Factom blockchain](https://www.factomprotocol.org/).

The main feature of the extension is the ability for existing web sites to easily integrate with Kambani and send arbitrary
signing requests for review and approval. This flexibility can be used as a building block in a wide variety of applications,
such as:

* passwordless authentication and authorization
* initiation of blockchain transactions (e.g. for web wallets)
* encrypted P2P communication 
* on-chain voting

The extension provides the following additional functionality:

* creation of encrypted vaults for storing private keys, using the AES-GCM encryption algorithm
* support for creation and update of digital identities based on [W3C DID](https://github.com/bi-foundation/FIS/blob/feature/DID/FIS/DID.md)
* support for importing and creating FCT and EC keys
* ECDSA digital signatures over the `secp256k1` (a.k.a. Bitcoin) elliptic curve
* EdDSA digital signatures over the `edwards25519` curve, as specified in [RFC8032](https://tools.ietf.org/html/rfc8032)
* RSA digital signatures
* paper backups for vaults

## Build
Run `ng build --aot` to build the project. The build artifacts will be stored in the `dist/` directory.

Run `ng build --aot --watch` to build the project for development. Any changes you make to the source code should be
automatically reflected in your location version of Kambani.

Run `ng build --prod` for a production build. The build artifacts will be stored in the `dist/` directory.

## Local installation of the extension
To install the extension locally:

1. Checkout the repository
1. Run `npm install`
1. Run `ng build --prod` or `ng build --aot --watch` (for a development build) from the project root directory
1. Open a Chrome browser and go to the special URL `chrome://extensions`
1. Make sure Developer Mode is switched on in the top-right corner
1. Click on the `Load Unpacked` link in the top-left corner
1. Choose the `dist/kambani` folder in the project root directory

The plugin should now be visible in your Chrome browser and should be listed on the `chrome://extensions` page

## Integration into existing websites
Kambani is designed to allow easy communication with existing websites. This is achieved by using [DOM CustomEvents](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent).
The rest of this document assumes that you are familiar with `CustomEvents`, in particular the way in which data can be passed
inside those events, so please take a minute to read through the docs if you are not.

The basic workflow for websites looking to integrate with Kambani is as follows:

* the website dispatches a `SigningRequest` `CustomEvent`, which contains the data that needs to be reviewed and signed by the user
* the user receives a notification of the incoming request(s)
* the user reviews the request(s) and either signs or cancels it(them)
* Kambani dispatches a `SigningResponse` `CustomEvent`, which can be intercepted by the website. The `SigningResponse` contains the
 signature from the user, together with additional metadata such as the public key and the type of signature, or an indication that
 the request has not been approved
 
To make it easier for application developers, the extension provides both generic data signing requests, in which an arbitrary
JSON object can be sent to the user, as well as application specific requests such as [PegNet](https://pegnet.org/) transfer,
conversion and burning requests.

### Example application
If you prefer to look at an example application, which integrates with Kambani, instead of reading through the rest of the
documentation, you can find a demo in the `examples/demo-voting-app` folder.

The application provides a working demonstration of obtaining the user's FCT & EC addresses, as well as multiple examples of
signing requests with FCT, EC and DID keys. Check the associated README for more information.

### Detecting Kambani
A website can detected if Kambani is installed in the user's browser by dispatching an `IsKambaniInstalled` `CustomEvent` and
listening for a `KambaniInstalled` event fired by Kambani in response.

Example code:
```javascript
  window.addEventListener("KambaniInstalled", event => {
    console.log("Kambani is installed")
  })
  window.dispatchEvent(new CustomEvent("IsKambaniInstalled"))
```

### FCT addresses request
A website can request access to the users public FCT addresses. This can be accomplished by dispatching a `GetFCTAddresses`
`CustomEvent` and listening for an `FCTAddresses` event fired by Kambani in response, following the user's approval.

Example code for requesting the user's FCT addresses:
```javascript
    const fctAddressesEvent = new CustomEvent("GetFCTAddresses");
    window.dispatchEvent(fctAddressesEvent);
```

Example code for listening for a response from Kambani:
```javascript
    window.addEventListener("FCTAddresses", event => {
      if (event.detail.success) {
        const fctAddresses = event.detail.fctAddresses;

        if (fctAddresses.length > 0) {
          console.log(JSON.stringify(fctAddresses, null, 2));
        }
      } else {
        console.log("GetFCTAddresses request not approved");
      }
    });
```

Note that if the user does not grant access to their FCT addresses, the `event.detail.success` value will be set to `false`.

If the user does grant access, subsequent requests from the same domain can obtain the FCT addresses without requiring explicit
approval from the user, unless the user manually revokes the access from their settings inside Kambani.

If access to the FCT addresses is granted, this also exposes the website to an `FCTAddressesChanged` event, which is used to
notify the website of any additions or removals of FCT addresses inside Kambani (more on this in the following sections).

### EC addresses request
Similarly to FCT addresses, websites can request access to the EC addresses of the user.

Example code for requesting the user's EC addresses:
```javascript
    const ecAddressesEvent = new CustomEvent("GetECAddresses");
    window.dispatchEvent(ecAddressesEvent);
```

Example code for listening for a response from Kambani:
```javascript
    window.addEventListener("ECAddresses", event => {
      if (event.detail.success) {
        const ecAddresses = event.detail.ecAddresses;

        if (ecAddresses.length > 0) {
          console.log(JSON.stringify(ecAddresses, null, 2));
        }
      } else {
        console.log("GetECAddresses request not approved");
      }
    });
```

The same disclaimers about subsequent access and changes to EC addresses apply as for FCT addresses.

### Changes to FCT or EC addresses
Once a given domain is granted access to the user's FCT and EC addresses, websites under this domain can listen for changes in
the user's addresses in the background in order to have an up-to-date state. This is accomplished by registering event listeners
for the `FCTAddressesChanged` and `ECAddressesChanged` events.

Example code for listening to EC addresses changes:
```javascript
    window.addEventListener("ECAddressesChanged", event => {
      console.log(event.detail);
      if (event.detail.removed) {
        const removedEcAddresses = event.detail.removed.map(addr => JSON.stringify(addr));
        console.log(removedEcAddresses);
      }   

      if (event.detail.added) {
        for (const addedAddress of event.detail.added) {
          console.log(addedAddress);
        }
      }   
    }); 
```

Identical code can be used to monitor for changes in FCT addresses using the `FCTAddressesChanged` event. A complete working example
is available in the `examples/demo-voting-app`.

### Data signing request
The most flexible type of signing request supported by Kambani is a "data" signing request. Websites can request a signature of
any JSON object by using this type of request. The signature is produced over the output bytes of SHA-256 of the stringified
JSON object.

In order to send a data signing request, the website needs to dispatch a `SigningRequest` event containing a `detail` object with
the following schema:

```
{
    "requestId": unique identifier (int/string, required),
    "requestType": "data" (required),
    "requestInfo": {
        "data": JSON object to sign (required),
        "keyType": one of "fct", "ec", "didKey" or "managementKey" (required),
        "keyIdentifier": string (optional),
        "did": string (optional)
    },
}
```

The semantics of the fields in the above schema is:

* `requestId`: should be a unique identifier for this request, which can be used for bookkeeping purposes in the website
* `requestType`: must be "data" and signifies to Kambani how this request should be treated
* `requestInfo.keyType`: what type of key must be used by the user to sign the message. Kambani will filter the keys
stored in the encrypted vault based on the provided `keyType` and will not allow signature from a different `keyType`
* `requestInfo.keyIdentifier`: the website has the ability to request a signature from a specific key. The user will only
be able to sign with the exact requested key. If a `keyType` of `fct` or `ec` is specified, the identifier should be
the public FCT or EC key. If a `didKey` or `managementKey` is specified, the `keyIdentifier` value should be the key
identifier of the DID or management key (see the [DID spec](https://github.com/bi-foundation/FIS/blob/feature/DID/FIS/DID.md)).
If there is no value specified for `keyIdentifier`, then the user will be able to choose with which key to sign from all
available keys of the given `keyType`
* `requestInfo.did`: must be a valid DID, as given in the [DID spec](https://github.com/bi-foundation/FIS/blob/feature/DID/FIS/DID.md).
This field can be set to request a signature from a specific DID and it must be used only if the `keyType` is `didKey` or
`managementKey`. The field is required if one of those `keyType`s is used AND a `keyIdentifier` is used as well

### PegNet requests
Kambani supports several types of PegNet specific requests to ease development of websites integrating with PegNet, such as
web wallets, trading platforms, e-shops, content platforms, etc.

To ensure the security of users, the PegNet requests initiated from a website contain only metadata, as opposed to the
transactions themselves. The building of the raw transaction bytes that are signed by the user is done inside Kambani.
Since the extension is fully open-sourced and anyone can audit the code, this provides strong guarantees that users
cannot be tricked into sending funds to the wrong address by a malicious website, for example.

#### FCT burning
To initiate a request for an FCT to pFCT burn, a website must send a `SigningRequest` `CustomEvent` with the following
schema of the `detail` object:

```
{
    "requestId": unique identifier (int/string, required),
    "requestType": "pegnet",
    "requestInfo": {
        "txType": "burn",
        "inputAddress": "FA..." (required),
        "inputAmount": integer (required),
    }
}
``` 

In case of a successfully signed transaction, the `SigningResponse` event contains a `transaction` field, which has the
raw signed transaction bytes ready to be submitted to the `factoid-submit` API endpoint of `factomd` without any modification.

#### PegNet transfer
To initiate a request for a PegNet transfer, a website must send a `SigningRequest` `CustomEvent` with the following
data in the `detail` object:

```
{
    "requestId": unique identifier (int/string, required),
    "requestType": "pegnet",
    "requestInfo": {
        "txType": "transfer",
        "inputAddress": "FA..." (required),
        "inputAsset": string (required),
        "inputAmount": integer (required)
        "outputAddress": "FA..." (required),
        "txMetadata": JSON object (optional),
    }
}
```

In case of a successfully signed transaction, the `SigningResponse` event contains an `entry` field, which is an array of
two values: the first being the `extIDs` for the transfer entry and the second being the entry content.

Note that:

* the entry is not signed by an EC key and so is **not paid for by the user**. Websites using the PegNet transfer request
type are currently expected to pay for those entries themselves, before broadcasting the entry to the Factom blockchain. 
We plan to modify this request type to allow websites to request payment from the user in a future version of Kambani
* the `txMetadata` field can be used to record optional metadata for the conversion entry. The JSON object passed to this field
will be put directly inside the `metadata` field of the PegNet transfer entry.

#### PegNet conversion
To initiate a request for a PegNet conversion, a website must send a `SigningRequest` `CustomEvent` with the following
schema of the `detail` object:

```
{
    "requestId": unique identifier (int/string, required),
    "requestType": "pegnet",
    "requestInfo": {
        "txType": "conversion",
        "inputAddress": "FA..." (required),
        "inputAsset": string (required),
        "inputAmount": integer (required)
        "outputAsset": string (required),
        "txMetadata": JSON object (optional),
    }
}
```

In case of a successfully signed transaction, the `SigningResponse` event contains an `entry` field, which is an array of
two values: the first being the `extIDs` for the conversion entry and the second being the entry content.

The same disclaimers for the payment of the entry and the `txMetadata` as for PegNet transfer transactions apply.

## Security and Privacy
We treat the security and privacy of Kambani users with utmost care.

All private keys in Kambani are stored encrypted in-memory and at-rest using state-of-the-art AES-GCM encryption, with a strong
passphrase.

Decryption of the private keys is only done when signing an incoming message, or when importing them from an encrypted file,
thus greatly limiting the time window during which any sensitive cryptographic material is exposed in plaintext to a potential attacker.

As of the latest version of the extension, to protect the privacy of users, any requests for accessing their FCT or EC
public keys need to be explicitly approved. This is done to prevent websites from silently accessing the public keys and
checking the user's FCT balance (and subsequently using the person's assumed net worth to modify the web site content,
such as prices on an e-shop, e.g.). In addition to this, preventing access to the user's addresses, removes the possibility
of tracking the user across different websites.
