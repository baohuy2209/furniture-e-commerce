import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IBrand } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class BrandService {
  constructor(private http: HttpClient) {}
  getAllBrands(): Observable<{ message: string; data: IBrand[] }> {
    return this.http
      .get<{ message: string; data: IBrand[] }>(`${environment.backend_url}/brands`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getBrandDetail(id: string): Observable<{ message: string; data: IBrand }> {
    return this.http
      .get<{ message: string; data: IBrand }>(`${environment.backend_url}/brands/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  createNewBrand(data: IBrand): Observable<{ message: string; data: IBrand }> {
    return this.http
      .post<{ message: string; data: IBrand }>(`${environment.backend_url}/brands`, data, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  updateBrand(data: IBrand, id: string): Observable<{ message: string; data: IBrand }> {
    return this.http
      .patch<{ message: string; data: IBrand }>(`${environment.backend_url}/brands/${id}`, data, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteBrand(id: string): Observable<{ message: string; data: IBrand }> {
    return this.http
      .delete<{ message: string; data: IBrand }>(`${environment.backend_url}/brands/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
