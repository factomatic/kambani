import { catchError, retryWhen, take, concat, delay } from 'rxjs/operators';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor (
    private toastr: ToastrService,
    private spinner: NgxSpinnerService ) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next
      .handle(req)
      .pipe(
        retryWhen(errors => errors.pipe(delay(1000), take(3), concat(throwError(errors)))),
        catchError((err: HttpErrorResponse) => {
        this.spinner.hide();

        const errorMessage = 'A problem occurred while recording your DID. Please, try again!';
        this.toastr.error(errorMessage, 'Warning!');

        return throwError(err);
      }));
    }
}
