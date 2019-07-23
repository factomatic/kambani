export class TooltipMessages {
public static SignatureTypeTooltip = 'Both signature types allow you to sign messages ' +
  'and differ only in the mathematics underpinning them. Ed25519 is the more modern signature type and has ' +
  'a number of technical advantages over ECDSA, so unless you have a good reason to choose ECDSA, we strongly recommend ' +
  'that you stick with the default.';

  public static ControllerTooltip = 'The controller is the entity that will be making the signatures. ' +
  'This is usually the DID itself, but in case the DID is for a child, it can be the DID of the parent; ' +
  'if it is a document, it can be the DID of the company owning the document, etc. By default the controller is ' +
  'set to the DID you are currently creating. If the controller is a different DID, you should input the relevant DID instead.';

  public static AliasTooltip = 'A human-readable nickname for the key you are creating. ' +
  'It can help differentiate between different keys more easily if you are creating many.';

  public static AuthenticationDropdownTooltip = 'Generate keys that will be used specifically for authentication purposes. ' +
  'You can re-use keys created in the previous step.';

  public static ServicesHeaderTooltip = 'Register services used by the DID. These can be authentication providers, ' +
  'messaging hubs, credential repositories for verifiable claims, etc.';

  public static ServicesHeaderBoldPartTooltip = 'DO NOT put links to personally identifiable information ' +
  '(such as social media profiles, email addresses, phone numbers, etc.)';

  public static ServiceTypeTooltip = 'Choose a human-readable description of the type of service, e.g. KYCProvider, ' +
  'CredentialRepositoryService, MessagingHub, etc.';

  public static ServiceEndpointTooltip = 'Specify the URL for the service, e.g. https://example.com/KYCProvider';

  public static EncryptHeaderTooltipAdvancedMode = 'Choose a strong password to encrypt the private keys(s) of the DID.';

  public static EncryptHeaderBoldPartTooltipAdvancedMode = 'Make sure you store the password in a safe location: ' +
  'there is no password recovery if you lose your password and you will be unable to sign messages with your DID keys, if you lose it!';

  public static EncryptHeaderTooltipBasicMode = 'Choose a strong password to encrypt the private key of the DID.';

  public static EncryptHeaderBoldPartTooltipBasicMode = 'Make sure you store the password in a safe location: ' +
  'there is no password recovery if you lose your password and you will be unable to sign messages with your DID key, if you lose it!';
}
