import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { DialogsModule } from './components/dialogs/dialogs.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GuardsModule } from './core/guards/guards.module';
import { HighlightJsModule, HIGHLIGHT_JS } from 'angular-highlight-js';
import hljs from 'highlight.js/lib/highlight';
import json from 'highlight.js/lib/languages/json';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { NgModule } from '@angular/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { DeviceDetectorModule } from 'ngx-device-detector';
import { ServicesModule } from './core/services/services.module';
import { ToastrModule } from 'ngx-toastr';
import { VaultModule } from './components/vault/vault.module';
import { AppState } from './core/store/app.state';
import { environment } from '../environments/environment';
import { storeLogger } from 'ngrx-store-logger';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { SharedModule } from './components/shared/shared.module';

import { AppComponent } from './app.component';
import { appReducers } from './core/store/app.reducers';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { SignerComponent } from './components/signer/signer.component';
import { ActionReducer, StoreModule } from '@ngrx/store';
import { reducers } from './reducers';

hljs.registerLanguage('json', json);

export function logger(reducer: ActionReducer<AppState>): any {
  return storeLogger()(reducer);
}

export const metaReducers = environment.production || environment.staging ? [] : [logger];

export function highlightJsFactory() {
  return hljs;
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    SignerComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserAnimationsModule,
    BrowserModule,
    DialogsModule,
    FormsModule,
    GuardsModule,
    HighlightJsModule.forRoot({
      provide: HIGHLIGHT_JS,
      useFactory: highlightJsFactory
    }),
    MDBBootstrapModule.forRoot(),
    HttpClientModule,
    NgxSpinnerModule,
    DeviceDetectorModule.forRoot(),
    ReactiveFormsModule,
    SharedModule,
    ServicesModule,
    ToastrModule.forRoot(),
    VaultModule,
    StoreModule.forRoot(appReducers, { metaReducers })
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
