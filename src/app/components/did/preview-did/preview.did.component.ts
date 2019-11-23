import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { DIDDocument } from 'src/app/core/interfaces/did-document';
import { DidKeyEntryModel } from 'src/app/core/interfaces/did-key-entry';
import { ManagementKeyEntryModel } from 'src/app/core/interfaces/management-key-entry';
import { minifyPublicKey, minifyDid } from 'src/app/core/utils/helpers';
import { ServiceEntryModel } from 'src/app/core/interfaces/service-entry';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { DIDService } from 'src/app/core/services/did/did.service';


@Component({
  selector: 'app-preview-did',
  templateUrl: './preview.did.component.html',
  styleUrls: ['./preview.did.component.scss']
})
export class PreviewDidComponent implements OnInit {
  public minKey = minifyPublicKey;
  public minDid = minifyDid;
  public didId: string;
  public nickname: string;
  public managementKeys: ManagementKeyEntryModel[];
  public didKeys: DidKeyEntryModel[];
  public services: ServiceEntryModel[];
  public formScreenOpen: boolean = false;

  public currentMode = 1;

  constructor(
    private route: ActivatedRoute,
    private didService: DIDService,
    private vaultService: VaultService ) { }

  ngOnInit() {
    this.didId = this.route.snapshot.paramMap.get('id');

    const didPublicInfo = this.vaultService.getDIDPublicInfo(this.didId);
    const didDocument: DIDDocument = didPublicInfo.didDocument;
    this.nickname = didPublicInfo.nickname;
    this.managementKeys = didDocument.managementKey;
    this.didKeys = didDocument.didKey ? didDocument.didKey : [];
    this.services = didDocument.service ? didDocument.service : [];

    this.didService.loadDIDForUpdate(this.didId);

  }

  closeFormScreen() {
    this.formScreenOpen = false;
    // this.getDIDsInfo();
  }

}
