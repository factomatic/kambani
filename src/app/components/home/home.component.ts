import { Component, OnInit,ViewChild,ElementRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { BackupResultModel } from 'src/app/core/models/backup-result.model';
import { DialogsService } from 'src/app/core/services/dialogs/dialogs.service';
import { downloadFile } from 'src/app/core/utils/helpers';
import { ModalSizeTypes } from 'src/app/core/enums/modal-size-types';
import { PasswordDialogComponent } from '../dialogs/password/password.dialog.component';
import { VaultService } from 'src/app/core/services/vault/vault.service';
import { Chart } from 'chart.js';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})



export class HomeComponent implements OnInit {
  public didIds: string[] = [];
  

  constructor(
    private dialogsService: DialogsService,
    private toastr: ToastrService,
    private vaultService: VaultService) { }

  ngOnInit() {
    const didDocuments = this.vaultService.getAllDIDDocuments();
    this.didIds = Object.keys(didDocuments);
  }

  @ViewChild('signingRequests') chart: ElementRef;

  ngAfterViewInit() { this.createChart() }

  createChart() {

    var H = this.chart.nativeElement.getContext('2d');

        var gradientStroke1 = H.createLinearGradient(0, 0, 0, 200);
        gradientStroke1.addColorStop(0, 'rgb(37, 57, 146, 0.9)');
        var myChart = new Chart( H, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                type: 'line',
                datasets: [ {
                    label: 'Requests',
                    data: [30, 70, 30, 100, 50, 130, 100, 140],
                    backgroundColor: '#2371E1',
                    borderColor: '#2371E1',
                    pointBackgroundColor:'#fff',
                    pointHoverBackgroundColor:gradientStroke1,
                    pointBorderColor :gradientStroke1,
                    pointHoverBorderColor :gradientStroke1,
                    pointBorderWidth :0,
                    pointRadius :0,
                    pointHoverRadius :0,
                    borderWidth: 2
                }, ]
            },
            options: {
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                responsive: true,
                tooltips: {
                    mode: 'index',
                    titleFontSize: 12,
                    titleFontColor: 'rgba(225,225,225,0.9)',
                    bodyFontColor: 'rgba(225,225,225,0.9)',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    cornerRadius: 3,
                    intersect: false,
                },
                scales: {
                    xAxes: [ {
                        gridLines: {
                            color: '#e1e1e1',
                            zeroLineColor: '#e1e1e1'
                        },
                        ticks: {
                            fontSize: 2,
                            fontColor: '#e1e1e1'
                        }
                    } ],
                    yAxes: [ {
                        // display:false,
                        // ticks: {
                        //     display: false,
                        // }
                    } ]
                },
                title: {
                    display: false,
                },
                elements: {
                    line: {
                        borderWidth: 1
                    },
                    point: {
                        radius: 4,
                        hitRadius: 10,
                        hoverRadius: 4
                    }
                }
            }
        });

  }

  backupDid(didId: string) {
    const dialogMessage = 'Enter your vault password to open the vault and encrypt your DID';

    this.dialogsService.open(PasswordDialogComponent, ModalSizeTypes.ExtraExtraLarge, dialogMessage)
      .subscribe((vaultPassword: string) => {
        if (vaultPassword) {
          this.vaultService
            .backupSingleDIDFromVault(didId, vaultPassword)
            .subscribe((result: BackupResultModel) => {
              if (result.success) {
                const date = new Date();
                const didBackupFile = this.postProcessDidBackupFile(result.backup, didId);
                downloadFile(didBackupFile, `paper-did-UTC--${date.toISOString()}.txt`);
              } else {
                this.toastr.error(result.message);
              }
            });
        }
      });
  }

  private postProcessDidBackupFile(encryptedFile: string, didId: string) {
    const parsedFile = JSON.parse(encryptedFile);
    const newKeysFile: any = { };

    newKeysFile.data = parsedFile.data;
    newKeysFile.encryptionAlgo = {
      name: 'AES-GCM',
      iv: parsedFile.iv,
      salt: parsedFile.salt,
      tagLength: 128
    };
    newKeysFile.did = didId;

    return JSON.stringify(newKeysFile, null, 2);
  }
}
