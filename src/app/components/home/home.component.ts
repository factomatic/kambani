/// <reference types="chrome" />

import { Chart } from 'chart.js';
import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';

import { ChromeMessageType } from 'src/app/core/enums/chrome-message-type';
import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public pendingRequestsCount: number = 0;
  public signedRequestsCount: number = 0;
  public didsCount: number;
  private signedRequestsData: number[];
  private labels: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  constructor(
    private vaultService: VaultService,
    private zone: NgZone) { }

  ngOnInit() {
    this.didsCount = this.vaultService.getDIDsCount();
    this.signedRequestsCount = this.vaultService.getSignedRequestsCount();
    this.signedRequestsData = this.vaultService.getSignedRequestsData();
    
    chrome.runtime.sendMessage({type: ChromeMessageType.PendingRequestsCount}, (response) => {
      this.zone.run(() => {
        this.pendingRequestsCount = response.pendingRequestsCount;
      });
    });
  }

  @ViewChild('signedRequests') chart: ElementRef;

  ngAfterViewInit() {
    const today = new Date().getDay();
    const labels = this.labels.slice(today + 1, this.labels.length).concat(this.labels.slice(0, today + 1));
    const data = this.signedRequestsData.slice(today + 1, this.signedRequestsData.length).concat(this.signedRequestsData.slice(0, today + 1));

    this.createChart(labels, data);
  }

  createChart(labels: string[], data: number[]) {
    const H = this.chart.nativeElement.getContext('2d');

    var gradientStroke1 = H.createLinearGradient(0, 0, 0, 200);
    gradientStroke1.addColorStop(0, 'rgb(37, 57, 146, 0.9)');
    var myChart = new Chart( H, {
      type: 'line',
      data: {
        labels: labels,
        type: 'line',
        datasets: [ {
          label: 'Requests',
          data: data,
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
}
