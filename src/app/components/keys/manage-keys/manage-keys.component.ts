declare const Buffer;
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';

import { accessOrModifyVault } from 'src/app/core/utils/helpers';
import { BaseComponent } from '../../base.component';
import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { KeyType } from 'src/app/core/enums/key-type';
import { PrivateKeyAddressModalComponent } from '../../modals/private-key-address-modal/private-key-address-modal.component';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-manage-keys',
  templateUrl: './manage-keys.component.html',
  styleUrls: ['./manage-keys.component.scss']
})
export class ManageKeysComponent extends BaseComponent implements OnInit {
  public blockSigningKeysInfo = {};
  public blockSigningKeys: string[] = [];
  public displayedBlockSigningKeys: string[] = [];
  public selectedKeyType: KeyType = KeyType.BlockSigningKey;
  public KeyType = KeyType;
  public editKeyNickname: boolean[] = [];
  public pageSize: number = 6;
  public currentPage: number = 1;
  public currentStartIndex = 0;

  constructor(
    private dialogsService: DialogsService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private vaultService: VaultService ) {
      super();
    }

  ngOnInit() {
    chrome.tabs && chrome.tabs.getCurrent(function(tab) {
      if (tab === undefined) {
        chrome.runtime.sendMessage({type: ChromeMessageType.ManageKeysRequest}, (response) => {
          if (response.success) {
            const popup_url = chrome.runtime.getURL('index.html');
            chrome.tabs.create({'url': popup_url});
          }
        });
      } else {
        chrome.runtime.sendMessage({type: ChromeMessageType.CheckRequests}, (response) => {
          if (response.manageKeysRequested) {
            chrome.runtime.sendMessage({type: ChromeMessageType.NewTabOpen});
          }
        });
      }
    });

    this.getKeysInfo();
  }

  changeSelectedKeyType(keyType: KeyType) {
    this.selectedKeyType = keyType;
    this.currentPage = 1;
    this.currentStartIndex = 0;
    this.displayedBlockSigningKeys = this.blockSigningKeys.slice(this.currentStartIndex, this.currentStartIndex + this.pageSize);
  }

  editNickname(keyType: KeyType, publicKey: string, nickname: string) {
    if (nickname.length > 0) {
      this.vaultService.updateKeyNickname(keyType, publicKey, nickname);
      this.blockSigningKeysInfo[publicKey] = nickname;
    }

    this.editKeyNickname[publicKey] = false;
  }

  viewPrivateKey(publicKey: string) {
    const dialogMessage = 'Enter your vault password to view the secret key';
    accessOrModifyVault(this, this.vaultService, this.dialogsService, dialogMessage, this.displayPrivateKey, publicKey);
  }

  removeKey(keyType: KeyType, publicKey: string) {
    const dialogMessage = '<b>Warning! You are about to delete your Block Signing key</b>. If you want to continue, enter your vault password';
    accessOrModifyVault(this, this.vaultService, this.dialogsService, dialogMessage, this._removeKey, keyType, publicKey);
  }

  copyKey(key: string, element) {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = key;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);

    element.classList.add('clicked');
    setTimeout(() => {element.classList.remove('clicked')},2000);
  }

  changePage(page) {
    this.currentPage = page;
    this.currentStartIndex = (this.currentPage - 1) * this.pageSize;

    this.displayedBlockSigningKeys = this.blockSigningKeys.slice(this.currentStartIndex, this.currentStartIndex + this.pageSize);
  }

  private getKeysInfo() {
    this.blockSigningKeysInfo = this.vaultService.getBlockSigningKeysPublicInfo();
    this.blockSigningKeys = Object.keys(this.blockSigningKeysInfo);
    this.displayedBlockSigningKeys= this.blockSigningKeys.slice(this.currentStartIndex, this.currentStartIndex + this.pageSize);
  }

  private displayPrivateKey(that: any, vaultPassword: string, publicKey: string) {
    that.spinner.show();
    that.vaultService
      .getPrivateKeyOrAddress(publicKey, vaultPassword)
      .subscribe(result => {
        that.spinner.hide();
        if (result.success && result.message) {
          const confirmRef = that.modalService.open(PrivateKeyAddressModalComponent);
          confirmRef.componentInstance.publicKeyOrAddress = publicKey;
          confirmRef.componentInstance.privateKeyOrAddress = result.message;
          confirmRef.componentInstance.isKey = true;
          confirmRef.result
            .then((result) => {})
            .catch((error) => {});
        } else if (!result.success) {
          that.toastr.error(result.message);
        }
      });
  }

  private _removeKey(that: any, vaultPassword: string, keyType: KeyType, publicKey: string) {
    that.spinner.show();
    that.vaultService
      .removeKey(keyType, publicKey, vaultPassword)
      .subscribe(result => {
        that.spinner.hide();
        if (result.success) {
          that.toastr.success(result.message);
          that.getKeysInfo();
        } else {
          that.toastr.error(result.message);
        }
      });
  }
}
