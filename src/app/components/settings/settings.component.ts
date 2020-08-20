import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import CustomValidators from 'src/app/core/utils/customValidators';
import { FactomAddressType } from 'src/app/core/enums/factom-address-type';
import { KeyType } from 'src/app/core/enums/key-type';
import { ResultModel } from 'src/app/core/models/result.model';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { RemoveConfirmModalComponent } from '../modals/remove-confirm-modal/remove-confirm-modal.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  public factomAddressType = FactomAddressType;
  public keyType = KeyType;
  public selectedTab: string = 'domains';
  public changePasswordForm;
  public fctAddressesRequestWhitelistedDomains: [];
  public ecAddressesRequestWhitelistedDomains: [];
  public etherLinkAddressesRequestWhitelistedDomains: [];
  public blockSigningKeysRequestWhitelistedDomains: [];
  public fctRequestExpanded: boolean = true;
  public ecRequestExpanded: boolean = true;
  public etherLinkRequestExpanded: boolean = true;
  public blockSigningKeyRequestExpanded: boolean = true;

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private router: Router,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private vaultService: VaultService) { }

  ngOnInit() {
    chrome.tabs && chrome.tabs.getCurrent(function(tab) {
      if (tab === undefined) {
        chrome.runtime.sendMessage({type: ChromeMessageType.SettingsRequest}, (response) => {
          if (response.success) {
            const popup_url = chrome.runtime.getURL('index.html');
            chrome.tabs.create({'url': popup_url});
          }
        });
      } else {
        chrome.runtime.sendMessage({type: ChromeMessageType.CheckRequests}, (response) => {
          if (response.settingsRequested) {
            chrome.runtime.sendMessage({type: ChromeMessageType.NewTabOpen});
          }
        });
      }
    });

    this.getWhitelistedDomains();
    this.buildChangePasswordForm();
  }

  selectTab(tab: string) {
    this.selectedTab = tab;
  }

  checkIsActive(tab: string) {
    return this.selectedTab === tab;
  }

  removeDomain(requestType: string, domain: string) {
    const confirmRef = this.modalService.open(RemoveConfirmModalComponent);
    confirmRef.componentInstance.objectType = 'domain';
    confirmRef.result.then((result) => {
      this.vaultService.removeWhitelistedDomain(requestType, domain);
      this.getWhitelistedDomains();
    }).catch((error) => {
    });
  }

  changePassword() {
    if (this.changePasswordForm.invalid) {
      return;
    }

    this.spinner.show();
    this.vaultService
      .changeVaultPassword(this.oldPassword.value, this.newPassword.value)
      .subscribe((result: ResultModel) => {
        this.spinner.hide();
        if (result.success) {
          this.toastr.success(result.message);
          this.router.navigate(['home']);
        } else {
          this.toastr.error(result.message);
        }
      })
  }

  private buildChangePasswordForm() {
    this.changePasswordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(18)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: CustomValidators.passwordsDoMatch.bind(this)});
  }

  private getWhitelistedDomains() {
    this.fctAddressesRequestWhitelistedDomains = this.vaultService.getFCTAddressesRequestWhitelistedDomains();
    this.ecAddressesRequestWhitelistedDomains = this.vaultService.getECAddressesRequestWhitelistedDomains();
    this.etherLinkAddressesRequestWhitelistedDomains = this.vaultService.getEtherLinkAddressesRequestWhitelistedDomains();
    this.blockSigningKeysRequestWhitelistedDomains = this.vaultService.getBlockSigningKeysRequestWhitelistedDomains();
  }

  get oldPassword () {
    return this.changePasswordForm.get('oldPassword');
  }

  get newPassword () {
    return this.changePasswordForm.get('password');
  }

  get confirmPassword() {
    return this.changePasswordForm.get('confirmPassword');
  }
}