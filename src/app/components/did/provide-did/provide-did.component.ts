import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

import { DIDService } from 'src/app/core/services/did/did.service';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

@Component({
  selector: 'app-provide-did',
  templateUrl: './provide-did.component.html',
  styleUrls: ['./provide-did.component.scss']
})
export class ProvideDidComponent implements OnInit {
  public provideForm: FormGroup;

  constructor(
    private didService: DIDService,
    private fb: FormBuilder,
    private workflowService: WorkflowService) { }

  ngOnInit() {
    this.provideForm = this.fb.group({
      didId: ['', [Validators.required]]
    });
  }

  goToNext() {
    if (this.didId.valid) {
      this.didService.upload(this.didId.value);
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
