import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IUpholstery } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UlphosteryService {
  constructor(private http: HttpClient) {}
  getAllUpholstery(): Observable<{ message: string; data: IUpholstery }> {
    return this.http
      .get<{ message: string; data: IUpholstery }>(`${environment.backend_url}/upholstery`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  createNewUpholstery(data: IUpholstery): Observable<{ message: string; data: IUpholstery }> {
    return this.http
      .post<{ message: string; data: IUpholstery }>(`${environment.backend_url}/upholstery`, data, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailUpholstery(id: string): Observable<{ message: string; data: IUpholstery }> {
    return this.http
      .get<{ message: string; data: IUpholstery }>(`${environment.backend_url}/upholstery/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  updateUpholstery(
    id: string,
    data: IUpholstery,
  ): Observable<{ message: string; data: IUpholstery }> {
    return this.http
      .patch<{ message: string; data: IUpholstery }>(
        `${environment.backend_url}/upholstery/${id}`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteUpholstery(id: string): Observable<{ message: string; data: IUpholstery }> {
    return this.http
      .delete<{ message: string; data: IUpholstery }>(
        `${environment.backend_url}/upholstery/${id}`,
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
