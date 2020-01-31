import { ActionReducer, StoreModule, MetaReducer } from '@ngrx/store';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HighlightJsModule, HIGHLIGHT_JS } from 'angular-highlight-js';
import hljs from 'highlight.js/lib/highlight';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import json from 'highlight.js/lib/languages/json';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { NgModule } from '@angular/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { storeLogger } from 'ngrx-store-logger';
import { ToastrModule } from 'ngx-toastr';

import { AppComponent } from './app.component';
import { appReducers } from './core/store/app.reducers';
import { AppRoutingModule } from './app-routing.module';
import { ApprovalRequestsComponent } from './components/approval-requests/approval-requests.component';
import { AppState } from './core/store/app.state';
import { DialogsModule } from './components/dialogs/dialogs.module';
import { environment } from '../environments/environment';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { GuardsModule } from './core/guards/guards.module';
import { HomeComponent } from './components/home/home.component';
import { ModalsModule } from './components/modals/modals.module';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ServicesModule } from './core/services/services.module';
import { SettingsComponent } from './components/settings/settings.component';
import { SignerComponent } from './components/signer/signer.component';
import { VaultModule } from './components/vault/vault.module';

hljs.registerLanguage('json', json);

export function highlightJsFactory() {
  return hljs;
}

export function logger(reducer: ActionReducer<AppState>): any {
  return storeLogger()(reducer);
}

export const metaReducers: MetaReducer<AppState>[] = environment.production || environment.staging ? [] : [logger];

@NgModule({
  declarations: [
    AppComponent,
    ApprovalRequestsComponent,
    HomeComponent,
    NavbarComponent,
    SettingsComponent,
    SignerComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    DeviceDetectorModule.forRoot(),
    DialogsModule,
    FormsModule,
    GuardsModule,
    HighlightJsModule.forRoot({
      provide: HIGHLIGHT_JS,
      useFactory: highlightJsFactory
    }),
    HttpClientModule,
    MDBBootstrapModule.forRoot(),
    ModalsModule,
    NgxSpinnerModule,
    ReactiveFormsModule,
    ServicesModule,
    StoreModule.forRoot(appReducers, { metaReducers }),
    ToastrModule.forRoot(),
    VaultModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
