import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IPaymentMethod } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class MyPaymentService {
  constructor(private http: HttpClient) {}
  getUserPayment(): Observable<{ message: string; data: IPaymentMethod[] }> {
    return this.http
      .get<{ message: string; data: IPaymentMethod[] }>(
        `${environment.backend_url}/payment-methods/user`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  createNewPaymentMethod(
    data: IPaymentMethod,
  ): Observable<{ message: string; data: IPaymentMethod }> {
    return this.http
      .post<{ message: string; data: IPaymentMethod }>(
        `${environment.backend_url}/payment-methods`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  deletePaymentMethod(paymentMethodId: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(
        `${environment.backend_url}/payment-methods/${paymentMethodId}`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  setDefaultPaymentMethod(
    paymentMethodId: string,
  ): Observable<{ message: string; data: IPaymentMethod }> {
    return this.http
      .patch<{ message: string; data: IPaymentMethod }>(
        `${environment.backend_url}/payment-methods/${paymentMethodId}/default`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
