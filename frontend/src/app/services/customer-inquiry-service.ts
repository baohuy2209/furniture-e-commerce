import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { ICustomerInquiry } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CustomerInquiryService {
  constructor(private http: HttpClient) {}
  createInquiry(data: ICustomerInquiry): Observable<{ message: string; data: ICustomerInquiry }> {
    return this.http
      .post<{ message: string; data: ICustomerInquiry }>(
        `${environment.backend_url}/inquiries`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }

  getUserInquiries(): Observable<{ message: string; data: ICustomerInquiry }> {
    return this.http
      .get<{ message: string; data: ICustomerInquiry }>(
        `${environment.backend_url}/inquiries/user`,
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
