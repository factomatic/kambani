new Vue({
  el: "#app",
  mounted: function () {
    /*
      Listens for a signing response after dispatching SigningRequest event
    */
    window.addEventListener("SigningResponse", event => {
      console.log(event.detail);
      this.voteSignature = JSON.stringify(event.detail, null, 2);
    });

    /*
      Listens for a response after dispatching GetFCTAddresses event
    */
    window.addEventListener("FCTAddresses", event => {
      console.log(event.detail);
      if (event.detail.success) {
        this.fctAddresses = event.detail.fctAddresses;

        if (this.fctAddresses.length > 0) {
          this.fctAddressesStringified = JSON.stringify(this.fctAddresses, null, 2);
        }
      } else {
        console.log('FCTAddresses request not approved');
      }
    });

    /*
      Listens for a response after dispatching GetECAddresses event
    */
    window.addEventListener("ECAddresses", event => {
      console.log(event.detail);
      if (event.detail.success) {
        this.ecAddresses = event.detail.ecAddresses;

        if (this.ecAddresses.length > 0) {
          this.ecAddressesStringified = JSON.stringify(this.ecAddresses, null, 2);
        }
      } else {
        console.log('ECAddresses request not approved');
      }
    });

    /*
      Listens for changes in the FCT addresses and updates them
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
        this.fctAddressesStringified = 'You currently have no FCT Addresses';
      }
    });

    /*
      Listens for changes in the EC addresses and updates them
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
        this.ecAddressesStringified = 'You currently have no EC Addresses';
      }
    });

    /*
      Dispatches GetFCTAddresses and GetECAddresses events in order to obtain all addresses stored in the extension
    */
    const fctAddressesEvent = new CustomEvent("GetFCTAddresses");
    window.dispatchEvent(fctAddressesEvent);

    const ecAddressesEvent = new CustomEvent("GetECAddresses");
    window.dispatchEvent(ecAddressesEvent);
  },
  data: {
    selected: 'Leo Messi',
    voteSignature: undefined,
    fctAddresses: [],
    ecAddresses: [],
    fctAddressesStringified: 'You currently have no FCT Addresses',
    ecAddressesStringified: 'You currently have no EC Addresses'
  },
  methods: {
    signWithFCTAddress: function () {
      this.voteSignature = undefined;

      const fctRequestWithoutSpecifiedKey = {
        requestId: 18,
        requestType: 'data',
        requestInfo: {
          keyType: 'fct',
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
        requestType: 'data',
        requestInfo: {
          keyType: 'fct',
          data: {
            purpose: "Ballon D'or Voting",
            winner: this.selected
          },
          keyIdentifier: 'FA3YYXQX68BF6jUMqp63gSu5j5AmDoztstXoR8jUNpMxBJmw2rz5'
        }
      };

      const event = new CustomEvent("SigningRequest", {
        detail: fctRequestWithoutSpecifiedKey
      });
      
      window.dispatchEvent(event);
    },
    signWithECAddress: function () {
      /*
        If there are no EC addresses in the extension, EC request without specified key will be dispatched.
        Otherwise, the firts EC address will be used for keyIdentifier.
      */

      let ecRequest;
      this.voteSignature = undefined;

      if (this.ecAddresses.length > 0) {
        const firstECAddressObject = this.ecAddresses[0];
        const firstECAddress = Object.keys(firstECAddressObject)[0];
        const firstECAddressNickname = firstECAddressObject[firstECAddress];

        ecRequest = {
          requestId: 21,
          requestType: 'data',
          requestInfo: {
            keyType: 'ec',
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
          requestType: 'data',
          requestInfo: {
            keyType: 'ec',
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

      const didRequestWithoutSpecifiedDID = {
        requestId: 22,
        requestType: 'data',
        requestInfo: {
          keyType: 'didKey',
          data: {
            purpose: "Ballon D'or Voting",
            winner: this.selected
          }
        }
      };

      /*
        Before dispatching this request please put a valid did and keyIdentifier
        which you have created in the Kambani extension
      */
      const didRequestWithSpecifiedDIDAndKeyIdentifier = {
        requestId: 23,
        requestType: 'data',
        requestInfo: {
          keyType: 'didKey',
          data: {
            purpose: "Ballon D'or Voting",
            winner: this.selected
          },
          did: 'did:factom:134709a8d2ab4ca0454a10f7d16007127b9359a849b762ed65855cc6286e2bac',
          keyIdentifier: 'my-signing-key'
        }
      };

      const event = new CustomEvent("SigningRequest", {
        detail: didRequestWithoutSpecifiedDID
      });
      
      window.dispatchEvent(event);
    }
  }
});
