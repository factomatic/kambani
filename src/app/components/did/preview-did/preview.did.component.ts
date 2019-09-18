import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { DidKeyEntryModel } from 'src/app/core/interfaces/did-key-entry';
import { ManagementKeyEntryModel } from 'src/app/core/interfaces/management-key-entry';
import { minifyPublicKey, minifyDid } from 'src/app/core/utils/helpers';
import { ServiceEntryModel } from 'src/app/core/interfaces/service-entry';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-preview-did',
  templateUrl: './preview.did.component.html',
  styleUrls: ['./preview.did.component.scss']
})
export class PreviewDidComponent implements OnInit {
  public minKey = minifyPublicKey;
  public minDid = minifyDid;
  public didId: string;
  public managementKeys: ManagementKeyEntryModel[];
  public didKeys: DidKeyEntryModel[];
  public services: ServiceEntryModel[];

  constructor(
    private route: ActivatedRoute,
    private vaultService: VaultService ) { }

  ngOnInit() {
    this.didId = this.route.snapshot.paramMap.get('id');

    const didDocument = this.vaultService.getDIDDocument(this.didId);
    this.managementKeys = didDocument.managementKey;
    this.didKeys = didDocument.didKey ? didDocument.didKey : [];
    this.services = didDocument.service ? didDocument.service : [];
  }
}
