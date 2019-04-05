import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { DialogsModule } from './components/dialogs/dialogs.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { GuardsModule } from './core/guards/guards.module';
import { HighlightJsModule, HIGHLIGHT_JS } from 'angular-highlight-js';
import hljs from 'highlight.js/lib/highlight';
import json from 'highlight.js/lib/languages/json';
import { NgModule } from '@angular/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ServicesModule } from './core/services/services.module';
import { ToastrModule } from 'ngx-toastr';
import { VaultModule } from './components/vault/vault.module';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { SignerComponent } from './components/signer/signer.component';

hljs.registerLanguage('json', json);

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
    NgxSpinnerModule,
    ReactiveFormsModule,
    ServicesModule,
    ToastrModule.forRoot(),
    VaultModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
