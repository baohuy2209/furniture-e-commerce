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

  getUserInquiries(): Observable<{ message: string; data: ICustomerInquiry[] }> {
    return this.http
      .get<{ message: string; data: ICustomerInquiry[] }>(
        `${environment.backend_url}/inquiries/user`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }

  getAllInquiries(filters?: any): Observable<{ message: string; data: ICustomerInquiry[] }> {
    return this.http
      .get<{ message: string; data: ICustomerInquiry[] }>(
        `${environment.backend_url}/inquiries/all`,
        {
          params: filters,
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }

  getInquiryById(id: string): Observable<{ message: string; data: ICustomerInquiry }> {
    return this.http
      .get<{ message: string; data: ICustomerInquiry }>(
        `${environment.backend_url}/inquiries/${id}`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }

  respondToInquiry(id: string, responseData: any): Observable<{ message: string; data: ICustomerInquiry }> {
    return this.http
      .patch<{ message: string; data: ICustomerInquiry }>(
        `${environment.backend_url}/inquiries/respond/${id}`,
        responseData,
        {
          withCredentials: true,
        },
      )
      .pipe(catchError(this.handleError));
  }

  deleteInquiry(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(
        `${environment.backend_url}/inquiries/${id}`,
        {
          withCredentials: true,
        },
      )
      .pipe(catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
