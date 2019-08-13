declare const Buffer;
import * as nacl from 'tweetnacl/nacl-fast';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Store, select } from '@ngrx/store';

import { AddOriginalManagementKeys, AddOriginalDidKeys, AddOriginalServices } from '../../store/form/form.actions';
import { AppState } from '../../store/app.state';
import { DIDDocument } from '../../interfaces/did-document';
import { DidKeyEntryModel } from '../../interfaces/did-key-entry';
import { DidKeyModel } from '../../models/did-key.model';
import { EntryType } from '../../enums/entry-type';
import { environment } from 'src/environments/environment';
import { ManagementKeyEntryModel } from '../../interfaces/management-key-entry';
import { ManagementKeyModel } from '../../models/management-key.model';
import { RevokeModel } from '../../interfaces/revoke-model';
import { ServiceEntryModel } from '../../interfaces/service-entry';
import { ServiceModel } from '../../models/service.model';
import { SignatureType } from '../../enums/signature-type';
import { toHexString, calculateChainId } from '../../utils/helpers';
import { UpdateEntryDocument } from '../../interfaces/update-entry-document';
import { VaultService } from '../vault/vault.service';

@Injectable()
export class DIDService {
  private VerificationKeySuffix = 'VerificationKey';
  private apiUrl = environment.apiUrl;
  private didMethodSpecVersion = environment.didMethodSpecVersion;
  private entrySchemaVersion = environment.entrySchemaVersion;
  private id: string;
  private nonce: string;
  private formManagementKeys: ManagementKeyModel[];
  private formDidKeys: DidKeyModel[];
  private formServices: ServiceModel[];
  private originalManagementKeys: Set<ManagementKeyModel>;
  private originalDidKeys: Set<DidKeyModel>;
  private originalServices: Set<ServiceModel>;

  constructor(
    private http: HttpClient,
    private store: Store<AppState>,
    private vaultService: VaultService) {
    this.store
      .pipe(select(state => state.form))
      .subscribe(form => {
        this.formManagementKeys = form.managementKeys;
        this.formDidKeys = form.didKeys;
        this.formServices = form.services;
        this.originalManagementKeys = new Set(form.originalManagementKeys);
        this.originalDidKeys = new Set(form.originalDidKeys);
        this.originalServices = new Set(form.originalServices);
      });
  }

  getId(): string {
    if (!this.id) {
      return this.generateId();
    }

    return this.id;
  }

  generateEntry(entryType: string): DIDDocument | UpdateEntryDocument {
    if (entryType === EntryType.UpdateDIDEntry) {
      return this.generateUpdateEntry();
    }

    return this.generateDocument();
  }

  getEntrySize(entry: DIDDocument | UpdateEntryDocument, entryType: string): number {
    return this.calculateEntrySize(
      [this.nonce],
      [entryType, this.entrySchemaVersion],
      JSON.stringify(entry)
    );
  }

  recordCreateEntryOnChain(entry: DIDDocument): Observable<Object> {
    const data = JSON.stringify([
      [EntryType.CreateDIDEntry, this.entrySchemaVersion, this.nonce],
      entry
    ]);

    return this.recordEntry(this.apiUrl, data);
  }

  recordUpdateEntryOnChain(entry: UpdateEntryDocument, managementKeyId: string, signature: string): Observable<Object> {
    const data = JSON.stringify([
      [EntryType.UpdateDIDEntry, this.entrySchemaVersion, managementKeyId, signature],
      entry
    ]);
    
    // change the api url with update endpoint
    const updateApiUrl = '';
    return this.recordEntry(updateApiUrl, data);
  }

  loadDIDForUpdate(didId: string): void {
    this.id = didId;
    const didDocument: DIDDocument = this.vaultService.getDIDDocument(didId);
    this.parseDocument(didDocument);
  }

  clearData(): void {
    this.id = undefined;
    this.nonce = undefined;
  }

  private recordEntry(apiUrl: string, data: string) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };
    
    return this.http.post(apiUrl, data, httpOptions);
  }

  private generateDocument(): DIDDocument {
    const managementKeys = this.formManagementKeys.map(k => (this.buildManagementKeyEntryObject(k)));

    const didDocument: DIDDocument = {
      'didMethodVersion': this.didMethodSpecVersion,
      'managementKey': managementKeys
    };

    const didKeys = this.formDidKeys.map(k => (this.buildDidKeyEntryObject(k)));
    if (didKeys.length > 0) {
      didDocument.didKey = didKeys;
    }

    const services = this.formServices.map(s => (this.buildServiceEntryObject(s)));
    if (services.length > 0) {
      didDocument.service = services;
    }

    return didDocument;
  }

  private generateUpdateEntry(): UpdateEntryDocument {
    const newManagementKeys = this.getNew(this.originalManagementKeys, this.formManagementKeys);
    const newDidKeys = this.getNew(this.originalDidKeys, this.formDidKeys);
    const newServices = this.getNew(this.originalServices, this.formServices);
    const revokedManagementKeys = this.getRevoked(this.originalManagementKeys, new Set(this.formManagementKeys));
    const revokedDidKeys = this.getRevoked(this.originalDidKeys, new Set(this.formDidKeys));
    const revokedServices = this.getRevoked(this.originalServices, new Set(this.formServices));

    const updateEntry: UpdateEntryDocument = {};

    if (newManagementKeys.length > 0 || newDidKeys.length > 0 || newServices.length > 0) {
      updateEntry['add'] = this.constructAddObject(
        newManagementKeys as ManagementKeyModel[],
        newDidKeys as DidKeyModel[],
        newServices as ServiceModel[]
      );
    }

    if (revokedManagementKeys.length > 0 || revokedDidKeys.length > 0 || revokedServices.length > 0) {
      updateEntry['revoke'] = this.constructRevokeObject(revokedManagementKeys, revokedDidKeys, revokedServices);
    }

    return updateEntry;
  }

  private buildManagementKeyEntryObject(key: ManagementKeyModel): ManagementKeyEntryModel {
    let keyEntryObject = this.buildKeyEntryObject(key);
    keyEntryObject['priority'] = key.priority;

    if (key.priorityRequirement) {
      keyEntryObject['priorityRequirement'] = key.priorityRequirement;
    }

    return keyEntryObject;
  }

  private buildDidKeyEntryObject(key: DidKeyModel): DidKeyEntryModel {
    let keyEntryObject = this.buildKeyEntryObject(key);
    keyEntryObject['purpose'] = key.purpose;

    if (key.priorityRequirement) {
      keyEntryObject['priorityRequirement'] = key.priorityRequirement;
    }

    return keyEntryObject;
  }

  private buildKeyEntryObject(key: ManagementKeyModel | DidKeyModel): ManagementKeyEntryModel | DidKeyEntryModel {
    const publicKeyProperty = key.type == SignatureType.RSA ? 'publicKeyPem' : 'publicKeyBase58';

    const keyEntryObject = {
      id: `${this.id}#${key.alias}`,
      type: `${key.type}${this.VerificationKeySuffix}`,
      controller: key.controller,
      [publicKeyProperty]: key.publicKey
    };

    return keyEntryObject;
  }

  private buildServiceEntryObject(service: ServiceModel): ServiceEntryModel {
    let serviceEntryObject = {
      id: `${this.id}#${service.alias}`,
      type: service.type,
      serviceEndpoint: service.endpoint
    };

    if (service.priorityRequirement) {
      serviceEntryObject['priorityRequirement'] = service.priorityRequirement;
    }

    return serviceEntryObject;
  }

  private getNew(original, current) {
    const _new = [];

    current.forEach(obj => {
      if (!original.has(obj)) {
        _new.push(obj);
      }
    });

    return _new;
  }

  private getRevoked(original, current): RevokeModel[] {
    const revoked: RevokeModel[] = [];

    original.forEach(obj => {
      if (!current.has(obj)) {
        revoked.push({ id: `${this.id}#${obj.alias}` });
      }
    });

    return revoked;
  }

  private constructAddObject(newManagementKeys: ManagementKeyModel[], newDidKeys: DidKeyModel[], newServices: ServiceModel[]): {} {
    const add = {};

    if (newManagementKeys.length > 0) {
      add['managementKey'] = newManagementKeys.map(k => (this.buildManagementKeyEntryObject(k)));
    }

    if (newDidKeys.length > 0) {
      add['didKey'] = newDidKeys.map(k => (this.buildDidKeyEntryObject(k)));
    }

    if (newServices.length > 0) {
      add['service'] = newServices.map(s => (this.buildServiceEntryObject(s)));
    }

    return add;
  }

  private constructRevokeObject(revokedManagementKeys: RevokeModel[], revokedDidKeys: RevokeModel[], revokedServices: RevokeModel[]): {} {
    const revoke = {};

    if (revokedManagementKeys.length > 0) {
      revoke['managementKey'] = revokedManagementKeys;
    }

    if (revokedDidKeys.length > 0) {
      revoke['didKey'] = revokedDidKeys;
    }

    if (revokedServices.length > 0) {
      revoke['service'] = revokedServices;
    }

    return revoke;
  }

  private generateId(): string {
    this.nonce = toHexString(nacl.randomBytes(32));

    const chainId = calculateChainId([EntryType.CreateDIDEntry, this.entrySchemaVersion, this.nonce]);
    this.id = `did:factom:${chainId}`;
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

  private parseDocument(didDocument: DIDDocument): void {
    const managementKeys = this.extractManagementKeys(didDocument.managementKey);
    this.store.dispatch(new AddOriginalManagementKeys(managementKeys));

    if (didDocument.didKey) {
      const didKeys = this.extractDidKeys(didDocument.didKey);
      this.store.dispatch(new AddOriginalDidKeys(didKeys));
    }

    if (didDocument.service) {
      const services = this.extractServices(didDocument.service);
      this.store.dispatch(new AddOriginalServices(services));
    }
  }

  private extractManagementKeys(documentManagementKeys: ManagementKeyEntryModel[]): ManagementKeyModel[] {
    return documentManagementKeys.map(k => new ManagementKeyModel(
      k.id.split('#')[1],
      k.priority,
      k.type,
      k.controller,
      k.publicKeyBase58 ? k.publicKeyBase58 : k.publicKeyPem,
      undefined,
      k.priorityRequirement
    ));
  }

  private extractDidKeys(documentDidKeys: DidKeyEntryModel[]): DidKeyModel[] {
    return documentDidKeys.map(k => new DidKeyModel(
      k.id.split('#')[1],
      k.purpose,
      k.type,
      k.controller,
      k.publicKeyBase58 ? k.publicKeyBase58 : k.publicKeyPem,
      undefined,
      k.priorityRequirement
    ));
  }

  private extractServices(documentServices: ServiceEntryModel[]): ServiceModel[] {
    return documentServices.map(s => new ServiceModel(
      s.type,
      s.serviceEndpoint,
      s.id.split('#')[1],
      s.priorityRequirement
    ));
  }
}
