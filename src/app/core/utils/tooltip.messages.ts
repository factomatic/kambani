export class TooltipMessages {
  public static SignatureTypeTooltip = 'All signature types allow you to sign messages ' +
  'and differ only in the mathematics underpinning them. Ed25519 has a number of technical advantages over RSA and ECDSA ' +
  'and unless you have a good reason to choose an alternative you should stick with the default.';

  public static ControllerTooltip = 'The controller is the entity that will be making the signatures. ' +
  'This is usually the DID itself, but in case the DID is for a child, it can be the DID of the parent; ' +
  'if it is a document, it can be the DID of the company owning the document, etc. By default the controller is ' +
  'set to the DID you are currently creating. If the controller is a different DID, you should input the relevant DID instead.';

  public static AliasTooltip = 'A human-readable nickname for the key you are creating. ' +
  'It can help differentiate between different keys more easily if you are creating many.';

  public static ServicesHeaderTooltip = 'Register services used by the DID. These can be authentication providers, ' +
  'messaging hubs, credential repositories for verifiable claims, etc.';

  public static ServicesHeaderBoldPartTooltip = 'DO NOT put links to personally identifiable information ' +
  '(such as social media profiles, email addresses, phone numbers, etc.)';

  public static ServiceTypeTooltip = 'Choose a human-readable description of the type of service, e.g. KYCProvider, ' +
  'CredentialRepositoryService, MessagingHub, etc.';

  public static ServiceEndpointTooltip = 'Specify the URL for the service, e.g. https://example.com/KYCProvider';
}
