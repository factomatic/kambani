import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store, select } from '@ngrx/store';

import { ActionType } from 'src/app/core/enums/action-type';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from '../../base.component';
import CustomValidators from 'src/app/core/utils/customValidators';
import { DidKeyModel } from 'src/app/core/models/did-key.model';
import { DIDService } from 'src/app/core/services/did/did.service';
import { ServiceModel } from 'src/app/core/models/service.model';
import { Subscription } from 'rxjs';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';
import { ManagementKeyModel } from 'src/app/core/models/management-key.model';
import { ResultModel } from 'src/app/core/models/result.model';

@Component({
  selector: 'app-encrypt-keys',
  templateUrl: './encrypt-keys.component.html',
  styleUrls: ['./encrypt-keys.component.scss']
})
export class EncryptKeysComponent extends BaseComponent implements OnInit {
  private subscription$: Subscription;
  private tooltipMessages = { };
  public currentStepIndex: number;
  public encryptForm;
  public encryptedFile: string;
  public fileDowloaded: boolean;
  public keysGenerated: boolean;
  public didSaved: boolean;
  public headerTooltipMessage: string;
  public boldPartTooltipMessage: string;
  public continueButtonText = 'Skip';
  public managementKeys: ManagementKeyModel[];
  public didKeys: DidKeyModel[];
  public services: ServiceModel[];

  constructor(
    private didService: DIDService,
    private fb: FormBuilder,
    private store: Store<AppState>,
    private vaultService: VaultService,
    private workflowService: WorkflowService) {
    super();
  }

  ngOnInit() {
    this.registerTooltipMessages();
    this.subscription$ = this.store
     .pipe(select(state => state))
     .subscribe(state => {
        this.currentStepIndex = state.action.currentStepIndex;
        this.managementKeys = state.form.managementKeys;
        this.didKeys = state.form.didKeys;
        this.services = state.form.services;

        const selectedAction = state.action.selectedAction;
        this.headerTooltipMessage = this.tooltipMessages[selectedAction][0];
        this.boldPartTooltipMessage = this.tooltipMessages[selectedAction][1];

        if (state.form.managementKeys.length > 0 || state.form.didKeys.length > 0) {
          this.keysGenerated = true;
          this.continueButtonText = 'Next';
        }
     });

    this.subscriptions.push(this.subscription$);

    this.encryptForm = this.fb.group({
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: CustomValidators.passwordsDoMatch.bind(this)});
  }

  encryptKeys() {
    this.vaultService.saveDIDToVault(
      this.didService.getId(),
      this.managementKeys,
      this.didKeys,
      this.services,
      '123qweASD!@#').subscribe((result: ResultModel) => {
        console.log(result);
        if (result.success) {
          this.didSaved = true;
        }
      });
  }

  downloadFile() {
    if (this.encryptedFile) {
      const downloader = document.createElement('a');
      document.body.appendChild(downloader);

      const blob = new Blob([this.encryptedFile], { type: 'text/json' });
      const url = window.URL;
      const fileUrl = url.createObjectURL(blob);

      downloader.setAttribute('href', fileUrl);
      const date = new Date();
      downloader.setAttribute('download', `paper-did-UTC--${date.toISOString()}.txt`);
      downloader.click();

      this.fileDowloaded = true;
    }
  }

  goToNext() {
    if (this.didSaved) {
      this.workflowService.moveToNextStep();
    }
  }

  goToPrevious() {
    this.workflowService.moveToPreviousStep();
  }

  get password () {
    return this.encryptForm.get('password');
  }

  get confirmPassword () {
    return this.encryptForm.get('confirmPassword');
  }

  private postProcessDidFile(encryptedFile: string) {
    const parsedFile = JSON.parse(encryptedFile);
    const newKeysFile: any = { };

    newKeysFile.data = parsedFile.data;
    newKeysFile.encryptionAlgo = {
      name: 'AES-GCM',
      iv: parsedFile.iv,
      salt: parsedFile.salt,
      tagLength: 128
    };
    newKeysFile.did = this.didService.getId();

    return JSON.stringify(newKeysFile, null, 2);
  }

  private registerTooltipMessages() {
    this.tooltipMessages[ActionType.CreateAdvanced] = [
      TooltipMessages.EncryptHeaderTooltipAdvancedMode,
      TooltipMessages.EncryptHeaderBoldPartTooltipAdvancedMode
    ];

    this.tooltipMessages[ActionType.CreateBasic] = [
      TooltipMessages.EncryptHeaderTooltipBasicMode,
      TooltipMessages.EncryptHeaderBoldPartTooltipBasicMode
    ];
  }
}
