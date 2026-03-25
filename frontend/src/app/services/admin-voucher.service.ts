import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AdminVoucherService {
  private readonly apiUrl = `${environment.backend_url}/admin/vouchers`;

  constructor(private http: HttpClient) {}

  getVouchers(params: any): Observable<any> {
    return this.http
      .get<any>(this.apiUrl, { params, withCredentials: true })
      .pipe(retry(1), catchError(this.handleError));
  }

  getVoucher(id: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`, { withCredentials: true })
      .pipe(retry(1), catchError(this.handleError));
  }

  createVoucher(data: any): Observable<any> {
    return this.http
      .post<any>(this.apiUrl, data, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  updateVoucher(id: string, data: any): Observable<any> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, data, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  toggleVoucher(id: string): Observable<any> {
    return this.http
      .patch<any>(`${this.apiUrl}/${id}/toggle`, {}, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  deleteVoucher(id: string): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`, { withCredentials: true })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
}
