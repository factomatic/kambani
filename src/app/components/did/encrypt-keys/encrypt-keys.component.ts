import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store, select } from '@ngrx/store';

import { ActionType } from 'src/app/core/enums/action-type';
import { AppState } from 'src/app/core/store/app.state';
import { BaseComponent } from '../../base.component';
import CustomValidators from 'src/app/core/utils/customValidators';
import { DIDService } from 'src/app/core/services/did/did.service';
import { KeysService } from 'src/app/core/services/keys/keys.service';
import { Subscription } from 'rxjs';
import { TooltipMessages } from 'src/app/core/utils/tooltip.messages';
import { WorkflowService } from 'src/app/core/services/workflow/workflow.service';

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
  public headerTooltipMessage: string;
  public boldPartTooltipMessage: string;
  public continueButtonText = 'Skip';

  constructor(
    private didService: DIDService,
    private fb: FormBuilder,
    private store: Store<AppState>,
    private keysService: KeysService,
    private workflowService: WorkflowService) {
    super();
  }

  ngOnInit() {
    this.registerTooltipMessages();
    this.subscription$ = this.store
     .pipe(select(state => state))
     .subscribe(state => {
        this.currentStepIndex = state.action.currentStepIndex;
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
    if (this.encryptForm.invalid) {
      return;
    }

    this.keysService
      .encryptKeys(this.password.value)
      .subscribe(encryptedFile => {
        this.encryptedFile = this.postProcessDidFile(encryptedFile);
        this.encryptForm.reset();
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
    if (this.fileDowloaded || !this.keysGenerated) {
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
