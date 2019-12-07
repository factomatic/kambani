import { Chart } from 'chart.js';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

import { VaultService } from 'src/app/core/services/vault/vault.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public didsCount: number;
  public fctAddressesCount: number;
  public ecAddressesCount: number;
  private signedRequestsData: number[];
  private labels: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  constructor(private vaultService: VaultService) { }

  ngOnInit() {
    this.didsCount = this.vaultService.getDIDsCount();
    this.fctAddressesCount = Object.keys(this.vaultService.getFCTAddressesPublicInfo()).length;
    this.ecAddressesCount = Object.keys(this.vaultService.getECAddressesPublicInfo()).length;
    this.signedRequestsData = this.vaultService.getSignedRequestsData();
  }

  @ViewChild('signedRequests') chart: ElementRef;

  ngAfterViewInit() {
    const today = new Date().getDay();
    const labels = this.labels.slice(today + 1, this.labels.length).concat(this.labels.slice(0, today + 1));

    this.createChart(labels, this.signedRequestsData);
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
            ticks: {
              suggestedMin: 0,    // minimum will be 0, unless there is a lower value.
              userCallback: function(label, index, labels) {
                   // when the floored value is the same as the value we have a whole number
                   if (Math.floor(label) === label) {
                       return label;
                   }

               },
              // OR //
              beginAtZero: true   // minimum value will be 0.
            }
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
