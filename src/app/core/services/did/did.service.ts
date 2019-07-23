declare const Buffer;
import * as nacl from 'tweetnacl/nacl-fast';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';

import { AddOriginalAuthenticationKeys, AddOriginalPublicKeys, AddOriginalServices } from '../../store/form/form.actions';
import { AppState } from '../../store/app.state';
import { DIDDocument } from '../../interfaces/did-document';
import { EntryType } from '../../enums/entry-type';
import { environment } from 'src/environments/environment';
import { KeyModel } from '../../models/key.model';
import { ServiceModel } from '../../models/service.model';
import { SignatureType } from '../../enums/signature-type';
import { toHexString, calculateChainId, calculateSha512 } from '../../utils/helpers';

@Injectable()
export class DIDService {
  private VerificationKeySuffix = 'VerificationKey';
  private apiUrl = environment.apiUrl;
  private version = environment.version;
  private id: string;
  private nonce: string;
  private formPublicKeys: KeyModel[];
  private formAuthenticationKeys: KeyModel[];
  private formServices: ServiceModel[];
  private originalPublicKeys: Set<KeyModel>;
  private originalAuthenticationKeys: Set<KeyModel>;
  private originalServices: Set<ServiceModel>;

  constructor(
    private http: HttpClient,
    private store: Store<AppState>) {
    this.store
      .pipe(select(state => state.form))
      .subscribe(form => {
        this.formPublicKeys = form.publicKeys;
        this.formAuthenticationKeys = form.authenticationKeys;
        this.formServices = form.services;
        this.originalPublicKeys = new Set(form.originalPublicKeys);
        this.originalAuthenticationKeys = new Set(form.originalAuthenticationKeys);
        this.originalServices = new Set(form.originalServices);
      });
  }

  getId(): string {
    if (!this.id) {
      return this.generateId();
    }

    return this.id;
  }

  generateEntry(entryType: string): {} {
    if (entryType === EntryType.UpdateDIDEntry) {
      return this.generateUpdateEntry();
    }

    return this.generateDocument();
  }

  getEntrySize(entry: {}, entryType: string): number {
    return this.calculateEntrySize(
      [this.nonce],
      [entryType, this.version],
      JSON.stringify(entry)
    );
  }

  recordOnChain(entry: {}, entryType: string): Observable<Object> {
    const data = JSON.stringify([
      [entryType, this.version, this.nonce],
      entry
    ]);

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post(this.apiUrl, data, httpOptions);
  }

  upload(didId: string) {
    // call resolver to get did document
    // tslint:disable-next-line:max-line-length
    const response = `{"@context":"https://w3id.org/did/v1","id":"did:fctr:f7a3860023452c7db222c7fd9d0e055b9ba3f9f9db02692b2eec8351c71b8e5c","publicKey":[{"id":"did:fctr:f7a3860023452c7db222c7fd9d0e055b9ba3f9f9db02692b2eec8351c71b8e5c#myfirstkey","type":"Ed25519VerificationKey","controller":"did:fctr:f7a3860023452c7db222c7fd9d0e055b9ba3f9f9db02692b2eec8351c71b8e5c","publicKeyBase58":"GtRQwPQ6a8Qe9DbzBCTmBERovZ4URh7BvwziQMURRaEQ"},{"id":"did:fctr:f7a3860023452c7db222c7fd9d0e055b9ba3f9f9db02692b2eec8351c71b8e5c#mysecondkey","type":"ECDSASecp256k1VerificationKey","controller":"did:fctr:f7a3860023452c7db222c7fd9d0e055b9ba3f9f9db02692b2eec8351c71b8e5c","publicKeyBase58":"eeK7Saop24d3hej7r4BNgyna6pXrCEbgCTZYHj7ApkRh"}],"authentication":["did:fctr:f7a3860023452c7db222c7fd9d0e055b9ba3f9f9db02692b2eec8351c71b8e5c#myfirstkey",{"id":"did:fctr:f7a3860023452c7db222c7fd9d0e055b9ba3f9f9db02692b2eec8351c71b8e5c#mythirdkey","type":"Ed25519VerificationKey","controller":"did:fctr:f7a3860023452c7db222c7fd9d0e055b9ba3f9f9db02692b2eec8351c71b8e5c","publicKeyBase58":"2reWgag62C9ryZcCmheyzDVvQE5j9j1HCgVMbJBmoPvx"}],"service":[{"id":"did:fctr:f7a3860023452c7db222c7fd9d0e055b9ba3f9f9db02692b2eec8351c71b8e5c#myservice","type":"PhotoStreamService","serviceEndpoint":"https://example.org/photos/379283"}]}`;
    this.id = didId;
    const didDocument: DIDDocument = JSON.parse(response);
    this.parseDocument(didDocument);
  }

  sendUpdateEntryForSigning(entry: {}) {
    this.nonce = toHexString(nacl.randomBytes(32));
    const dataHash = calculateSha512(`${this.nonce}${JSON.stringify(entry)}`);
    const event = new CustomEvent('ContentToSign', { detail: dataHash });
    window.dispatchEvent(event);
  }

  clearData() {
    this.id = undefined;
    this.nonce = undefined;
  }

  private generateDocument(): DIDDocument {
    const publicKeys = this.transformPublicKeysToEntryObjects(this.formPublicKeys);
    const authenticationKeys = this.transformAuthenticationKeysToEntryObjects(this.formAuthenticationKeys, this.formPublicKeys);
    const services = this.transformServicesToEntryObjects(this.formServices);

    const didDocument: DIDDocument = {
      '@context': 'https://w3id.org/did/v1',
      'id': this.id,
      'publicKey': publicKeys,
      'authentication': authenticationKeys,
      'service': services
    };

    return didDocument;
  }

  private generateUpdateEntry(): {} {
    const newPublicKeys = this.getNew(this.originalPublicKeys, this.formPublicKeys);
    const newAuthenticationKeys = this.getNew(this.originalAuthenticationKeys, this.formAuthenticationKeys);
    const newServices = this.getNew(this.originalServices, this.formServices);
    const revokedPublicKeys = this.getRevoked(this.originalPublicKeys, new Set(this.formPublicKeys));
    const revokedAuthenticationKeys = this.getRevoked(this.originalAuthenticationKeys, new Set(this.formAuthenticationKeys));
    const revokedServices = this.getRevoked(this.originalServices, new Set(this.formServices));

    const updateEntry = {};

    if (newPublicKeys.length > 0 || newAuthenticationKeys.length > 0 || newServices.length > 0) {
      updateEntry['add'] = this.constructAddObject(
        newPublicKeys as KeyModel[],
        newAuthenticationKeys as KeyModel[],
        newServices as ServiceModel[]
      );
    }

    if (revokedPublicKeys.length > 0 || revokedAuthenticationKeys.length > 0 || revokedServices.length > 0) {
      updateEntry['revoke'] = this.constructRevokeObject(revokedPublicKeys, revokedAuthenticationKeys, revokedServices);
    }

    return updateEntry;
  }

  private transformPublicKeysToEntryObjects(publicKeys: KeyModel[]): Array<{}> {
    return publicKeys.map(k => (this.buildKeyEntryObject(k)));
  }

  private transformAuthenticationKeysToEntryObjects(authenticationKeys: KeyModel[], publicKeys: KeyModel[]) {
    /** Divided in two separate arrays because the embeddedKeys must be included first in the final array. */
    const embeddedAuthenticationKeys = [];
    const fullAuthenticationKeys = [];
    authenticationKeys.forEach(k => {
      if (publicKeys.includes(k)) {
        embeddedAuthenticationKeys.push(`${this.id}#${k.alias}`);
      } else {
        fullAuthenticationKeys.push(this.buildKeyEntryObject(k));
      }
    });

    return embeddedAuthenticationKeys.concat(fullAuthenticationKeys);
  }

  private transformServicesToEntryObjects(services: ServiceModel[]): Array<{}> {
    return services.map(s => ({
      id: `${this.id}#${s.alias}`,
      type: s.type,
      serviceEndpoint: s.endpoint
    }));
  }

  private buildKeyEntryObject(key: KeyModel): {} {
    const publicKeyProperty = key.type == SignatureType.RSA ? 'publicKeyPem' : 'publicKeyBase58';

    return {
      id: `${this.id}#${key.alias}`,
      type: `${key.type}${this.VerificationKeySuffix}`,
      controller: key.controller,
      [publicKeyProperty]: key.publicKey
    };
  }

  private getNew(original, current): Array<{}> {
    const _new = [];

    current.forEach(obj => {
      if (!original.has(obj)) {
        _new.push(obj);
      }
    });

    return _new;
  }

  private getRevoked(original, current): string[] {
    const revoked: string[] = [];

    original.forEach(obj => {
      if (!current.has(obj)) {
        revoked.push(obj.alias);
      }
    });

    return revoked;
  }

  private constructAddObject(newPublicKeys: KeyModel[], newAuthenticationKeys: KeyModel[], newServices: ServiceModel[]): {} {
    const add = {};

    if (newPublicKeys.length > 0) {
      add['publicKey'] = this.transformPublicKeysToEntryObjects(newPublicKeys as KeyModel[]);
    }

    if (newAuthenticationKeys.length > 0) {
      add['authentication'] = this.transformAuthenticationKeysToEntryObjects(newAuthenticationKeys as KeyModel[], this.formPublicKeys);
    }

    if (newServices.length > 0) {
      add['service'] = this.transformServicesToEntryObjects(newServices as ServiceModel[]);
    }

    return add;
  }

  private constructRevokeObject(revokedPublicKeys: string[], revokedAuthenticationKeys: string[], revokedServices: string[]): {} {
    const revoke = {};

    if (revokedPublicKeys.length > 0) {
      revoke['publicKey'] = revokedPublicKeys;
    }

    if (revokedAuthenticationKeys.length > 0) {
      revoke['authentication'] = revokedAuthenticationKeys;
    }

    if (revokedServices.length > 0) {
      revoke['service'] = revokedServices;
    }

    return revoke;
  }

  private generateId(): string {
    this.nonce = toHexString(nacl.randomBytes(32));

    const chainId = calculateChainId([EntryType.CreateDIDEntry, this.version, this.nonce]);
    this.id = `did:fctr:${chainId}`;
    return this.id;
  }

  private calculateEntrySize(hexExtIds: string[], utf8ExtIds: string[], content: string): number {
    let totalEntrySize = 0;
    const fixedHeaderSize = 35;
    totalEntrySize += fixedHeaderSize + 2 * hexExtIds.length + 2 * utf8ExtIds.length;

    totalEntrySize += hexExtIds.reduce((accumulator, currentHexExtId) => {
      return accumulator + currentHexExtId.length / 2;
    }, 0);

    totalEntrySize += utf8ExtIds.reduce((accumulator, currentUtf8ExtId) => {
      return accumulator + this.getBinarySize(currentUtf8ExtId);
    }, 0);

    totalEntrySize += this.getBinarySize(content);

    return totalEntrySize;
  }

  private getBinarySize(string): number {
    return Buffer.byteLength(string, 'utf8');
  }

  private parseDocument(didDocument: DIDDocument) {
    const publicKeys = this.extractPublicKeys(didDocument.publicKey);
    const authenticationKeys = this.extractAuthenticationKeys(didDocument.authentication, publicKeys);
    const services = this.extractServices(didDocument.service);

    this.store.dispatch(new AddOriginalAuthenticationKeys(authenticationKeys));
    this.store.dispatch(new AddOriginalPublicKeys(publicKeys));
    this.store.dispatch(new AddOriginalServices(services));
  }

  private extractPublicKeys(documentPubKeys: any[]): KeyModel[] {
    return documentPubKeys.map(k => new KeyModel(
      k.id.split('#')[1],
      k.type,
      k.controller,
      k.publicKeyBase58
    ));
  }

  private extractAuthenticationKeys(documentAuthKeys: any[], publicKeys: KeyModel[]): KeyModel[] {
    const authenticationKeys: KeyModel[] = [];
    documentAuthKeys.forEach(k => {
      if (typeof k === 'string') {
        const key = publicKeys.find(pk => pk.alias === k.split('#')[1]);
        authenticationKeys.push(key);
      } else {
        authenticationKeys.push(new KeyModel(
          k.id.split('#')[1],
          k.type,
          k.controller,
          k.publicKeyBase58
        ));
      }
    });

    return authenticationKeys;
  }

  private extractServices(documentServices: any[]): ServiceModel[] {
    return documentServices.map(s => new ServiceModel(
      s.type,
      s.serviceEndpoint,
      s.id.split('#')[1]
    ));
  }
}
