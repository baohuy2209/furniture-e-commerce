import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IAddress } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  constructor(private http: HttpClient) {}
  getAllAddressUser(): Observable<{ message: string; data: IAddress[] }> {
    return this.http
      .get<{ message: string; data: IAddress[] }>(`${environment.backend_url}/addresses/user`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  createNewAddress(data: IAddress): Observable<{ message: string; data: IAddress }> {
    return this.http
      .post<{ message: string; data: IAddress }>(`${environment.backend_url}/addresses`, data, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  setDefaultAddress(id: string): Observable<{ message: string; data: IAddress }> {
    return this.http
      .patch<{ message: string; data: IAddress }>(
        `${environment.backend_url}/addresses/default_address/${id}`,
        {},
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteAddress(id: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${environment.backend_url}/addresses/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }

  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
