import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IVoucher } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class PromotionService {
  constructor(private http: HttpClient) {}
  getVouchers(): Observable<{ message: string; data: IVoucher[] }> {
    return this.http
      .get<{ message: string; data: IVoucher[] }>(
        `${environment.backend_url}/promotions/vouchers`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getUserPoints(): Observable<{ message: string; data: number }> {
    return this.http
      .get<{ message: string; data: number }>(`${environment.backend_url}/promotions/points`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
