new Vue({
  el: "#app",
  mounted: function () {
    /*
      Listens for a SigningResponse after dispatching a SigningRequest event
    */
    window.addEventListener("SigningResponse", event => {
      console.log(event.detail);
      this.voteSignature = JSON.stringify(event.detail, null, 2);
    });

    /*
      Listens for a response after dispatching a GetFCTAddresses event
    */
    window.addEventListener("FCTAddresses", event => {
      console.log(event.detail);
      if (event.detail.success) {
        this.fctAddresses = event.detail.fctAddresses;

        if (this.fctAddresses.length > 0) {
          this.fctAddressesStringified = JSON.stringify(this.fctAddresses, null, 2);
        }
      } else {
        console.log("GetFCTAddresses request not approved");
      }
    });

    /*
      Listens for a response after dispatching a GetECAddresses event
    */
    window.addEventListener("ECAddresses", event => {
      console.log(event.detail);
      if (event.detail.success) {
        this.ecAddresses = event.detail.ecAddresses;

        if (this.ecAddresses.length > 0) {
          this.ecAddressesStringified = JSON.stringify(this.ecAddresses, null, 2);
        }
      } else {
        console.log("GetECAddresses request not approved");
      }
    });

    /*
      Listens for a response after dispatching a GetBlockSigningKeys event
    */
    window.addEventListener("BlockSigningKeys", event => {
      console.log(event.detail);
      if (event.detail.success) {
        console.log(event.detail.blockSigningKeys);
      } else {
        console.log("GetBlockSigningKeys request not approved");
      }
    });

    /*
      Listens for a response after dispatching a GetPegnetAddresses event
    */
    window.addEventListener("PegnetAddresses", event => {
      console.log(event.detail);
    });

    /*
      Listens for changes to the FCT addresses and updates them
    */
    window.addEventListener("FCTAddressesChanged", event => {
      console.log(event.detail);
      if (event.detail.removed) {
        const removedFctAddresses = event.detail.removed.map(addr => JSON.stringify(addr));
        this.fctAddresses = this.fctAddresses.filter(addr => !removedFctAddresses.includes(JSON.stringify(addr)));
      }

      if (event.detail.added) {
        for (const addedAddress of event.detail.added) {
          this.fctAddresses.push(addedAddress);
        }
      }

      if (this.fctAddresses.length > 0) {
        this.fctAddressesStringified = JSON.stringify(this.fctAddresses, null, 2);
      } else {
        this.fctAddressesStringified = "You currently have no FCT addresses or you haven't granted Kambani access to them";
      }
    });

    /*
      Listens for changes to the EC addresses and updates them
    */
    window.addEventListener("ECAddressesChanged", event => {
      console.log(event.detail);
      if (event.detail.removed) {
        const removedEcAddresses = event.detail.removed.map(addr => JSON.stringify(addr));
        this.ecAddresses = this.ecAddresses.filter(addr => !removedEcAddresses.includes(JSON.stringify(addr)));
      }

      if (event.detail.added) {
        for (const addedAddress of event.detail.added) {
          this.ecAddresses.push(addedAddress);
        }
      }

      if (this.ecAddresses.length > 0) {
        this.ecAddressesStringified = JSON.stringify(this.ecAddresses, null, 2);
      } else {
        this.ecAddressesStringified = "You currently have no EC addresses or you haven't granted Kambani access to them"
      }
    });

    /*
      Listens for changes to the EtherLink addresses
    */
    window.addEventListener("EtherLinkAddressesChanged", event => {
      console.log(event.detail);
    });

    /*
      Listens for changes to the Block Signing keys
    */
    window.addEventListener("BlockSigningKeysChanged", event => {
      console.log(event.detail);
    });

    /*
      Dispatches GetFCTAddresses, GetECAddresses, GetPegnetAddresses and GetBlockSigningKeys events
      in order to obtain all addresses and keys stored in the extension
    */
    const fctAddressesEvent = new CustomEvent("GetFCTAddresses");
    window.dispatchEvent(fctAddressesEvent);

    const ecAddressesEvent = new CustomEvent("GetECAddresses");
    window.dispatchEvent(ecAddressesEvent);

    const pegAddressesEvent = new CustomEvent("GetPegnetAddresses");
    window.dispatchEvent(pegAddressesEvent);

    const blockSigningKeysEvent = new CustomEvent("GetBlockSigningKeys");
    window.dispatchEvent(blockSigningKeysEvent);
  },
  data: {
    selected: "Leo Messi",
    voteSignature: undefined,
    fctAddresses: [],
    ecAddresses: [],
    fctAddressesStringified: "You currently have no FCT addresses or you haven't granted Kambani access to them",
    ecAddressesStringified: "You currently have no EC addresses or you haven't granted Kambani access to them"
  },
  methods: {
    signWithFCTAddress: function () {
      this.voteSignature = undefined;

      const fctRequestWithoutSpecifiedKey = {
        requestId: 18,
        requestType: "data",
        requestInfo: {
          keyType: "fct",
          data: {
            purpose: "Ballon D'or Voting",
            winner: this.selected
          }
        }
      };

      /*
        Before dispatching this request please put for keyIdentifier a valid FCT address
        which you have generated or imported in your Kambani extension
      */
      const fctRequestWithSpecifiedKey = {
        requestId: 19,
        requestType: "data",
        requestInfo: {
          keyType: "fct",
          data: {
            purpose: "Ballon D'or Voting",
            winner: this.selected
          },
          keyIdentifier: "FA3YYXQX68BF6jUMqp63gSu5j5AmDoztstXoR8jUNpMxBJmw2rz5"
        }
      };

      const event = new CustomEvent("SigningRequest", {
        detail: fctRequestWithoutSpecifiedKey
      });
      
      window.dispatchEvent(event);
    },
    signWithECAddress: function () {
      /*
        If there are no EC addresses in Kambani, an EC request without a
        specified key will be dispatched. Kambani will display the signing
        request to the user and will notify them of the lack of EC addresses,
        suggesting to create a new or import an existing EC address.

        Otherwise, the first (oldest by creation time)  EC address will be used
        as keyIdentifier.
      */

      let ecRequest;
      this.voteSignature = undefined;

      if (this.ecAddresses.length > 0) {
        const firstECAddressObject = this.ecAddresses[0];
        const firstECAddress = Object.keys(firstECAddressObject)[0];
        const firstECAddressNickname = firstECAddressObject[firstECAddress];

        ecRequest = {
          requestId: 21,
          requestType: "data",
          requestInfo: {
            keyType: "ec",
            data: {
              purpose: "Ballon D'or Voting",
              winner: this.selected
            },
            keyIdentifier: firstECAddress
          }
        };
      } else {
        ecRequest = {
          requestId: 20,
          requestType: "data",
          requestInfo: {
            keyType: "ec",
            data: {
              purpose: "Ballon D'or Voting",
              winner: this.selected
            }
          }
        };
      }
      
      const event = new CustomEvent("SigningRequest", {
        detail: ecRequest
      });
      
      window.dispatchEvent(event);
    },
    signWithDID: function () {
      this.voteSignature = undefined;

      /*
        If there are no DIDs in Kambani, Kambani will display the signing
        request to the user and will notify them of the lack of DIDs,
        suggesting to create a new DID.

        Otherwise, the user will be able to choose the DID and DIDKey with
        which to sign the request.
      */
      const didRequestWithoutSpecifiedDID = {
        requestId: 22,
        requestType: "data",
        requestInfo: {
          keyType: "didKey",
          data: {
            purpose: "Ballon D'or Voting",
            winner: this.selected
          }
        }
      };

      /*
        Before dispatching this request, please put a valid DID and keyIdentifier
        which you have created inside Kambani. If this is not done, Kambani
        will automatically return an unsuccessful SigningResponse.

        Since the DID and DIDKey are explicitly specified in the request, the
        user will not be able to choose a different DID or DIDKey with which to
        sign the request. They would either have to sign it with the given
        DID/key combination or cancel the request.
      */
      const didRequestWithSpecifiedDIDAndKeyIdentifier = {
        requestId: 23,
        requestType: "data",
        requestInfo: {
          keyType: "didKey",
          data: {
            purpose: "Ballon D'or Voting",
            winner: this.selected
          },
          did: "did:factom:134709a8d2ab4ca0454a10f7d16007127b9359a849b762ed65855cc6286e2bac",
          keyIdentifier: "my-signing-key"
        }
      };

      const event = new CustomEvent("SigningRequest", {
        detail: didRequestWithoutSpecifiedDID
      });
      
      window.dispatchEvent(event);
    },
    signWithBlockSigningKey: function () {
      this.voteSignature = undefined;

      const blockSigningKeyRequestWithoutSpecifiedKey = {
        requestId: 24,
        requestType: "data",
        requestInfo: {
          keyType: "blockSigningKey",
          data: {
            purpose: "Ballon D'or Voting",
            winner: this.selected
          }
        }
      };

      /*
        Before dispatching this request please put for keyIdentifier a valid Block Signing key
        which you have imported in your Kambani extension
      */
      const blockSigningKeyRequestWithSpecifiedKey = {
        requestId: 25,
        requestType: "data",
        requestInfo: {
          keyType: "blockSigningKey",
          data: {
            purpose: "Ballon D'or Voting",
            winner: this.selected
          },
          keyIdentifier: "4zvwRjXUKGfvwnParsHAS3HuSVzV5cA4McphgmoCtajS"
        }
      };

      const event = new CustomEvent("SigningRequest", {
        detail: blockSigningKeyRequestWithoutSpecifiedKey
      });
      
      window.dispatchEvent(event);
    }
  }
});
