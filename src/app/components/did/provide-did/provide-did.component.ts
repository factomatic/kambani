import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { DIDService } from 'src/app/core/services/did/did.service';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-provide-did',
  templateUrl: './provide-did.component.html',
  styleUrls: ['./provide-did.component.scss']
})
export class ProvideDidComponent implements OnInit {
  public didIds: string[];
  public provideForm: FormGroup;

  constructor(
    private didService: DIDService,
    private fb: FormBuilder,
    private vaultService: VaultService,
    private workflowService: WorkflowService) { }

  ngOnInit() {
    this.didIds = this.vaultService.getAllDIDIds();

    this.provideForm = this.fb.group({
      didId: [this.didIds[0], [
        Validators.required,
        Validators.pattern('^did:factom:[abcdef0-9]{64}$')
      ]]
    });
  }

  goToNext() {
    if (this.didId.valid) {
      this.didService.loadDIDForUpdate(this.didId.value);
      this.workflowService.moveToNextStep();
    }
  }

  goToPrevious() {
    this.workflowService.moveToPreviousStep();
  }

  get didId() {
    return this.provideForm.get('didId');
  }
}
