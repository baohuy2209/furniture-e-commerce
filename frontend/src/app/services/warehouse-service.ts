import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IWarehouse } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  constructor(private http: HttpClient) {}
  getAllWarehouse(): Observable<{ message: string; data: IWarehouse[] }> {
    return this.http
      .get<{ message: string; data: IWarehouse[] }>(`${environment.backend_url}/warehouse`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailWarehouse(id: string): Observable<{ message: string; data: IWarehouse }> {
    return this.http
      .get<{ message: string; data: IWarehouse }>(`${environment.backend_url}/warehouse/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  createNewWarehouse(data: IWarehouse): Observable<{ message: string; data: IWarehouse }> {
    return this.http
      .post<{ message: string; data: IWarehouse }>(
        `${environment.backend_url}/warehouse`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  updateWarehouse(id: string, data: IWarehouse): Observable<{ message: string; data: IWarehouse }> {
    return this.http
      .patch<{ message: string; data: IWarehouse }>(
        `${environment.backend_url}/warehouse/${id}`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteWarehouse(id: string): Observable<{ message: string; data: IWarehouse }> {
    return this.http
      .delete<{ message: string; data: IWarehouse }>(`${environment.backend_url}/warehouse/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
