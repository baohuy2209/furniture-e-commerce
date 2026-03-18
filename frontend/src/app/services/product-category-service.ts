import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IProductCategory } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ProductCategoryService {
  constructor(private http: HttpClient) {}

  getAllProductCategories(): Observable<{ message: string; data: IProductCategory[] }> {
    return this.http
      .get<{ message: string; data: IProductCategory[] }>(
        `${environment.backend_url}/product-categories`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getAllProductTypeCategories(): Observable<{ message: string; data: IProductCategory[] }> {
    return this.http
      .get<{ message: string; data: IProductCategory[] }>(
        `${environment.backend_url}/product-categories/product_type`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailProductCategories(id: string): Observable<{ message: string; data: IProductCategory }> {
    return this.http
      .get<{ message: string; data: IProductCategory }>(
        `${environment.backend_url}/product-categories/${id}`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  createProductCategory(
    data: IProductCategory,
  ): Observable<{ message: string; data: IProductCategory }> {
    return this.http
      .post<{ message: string; data: IProductCategory }>(
        `${environment.backend_url}/product-categories`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  updateProductCategory(
    id: string,
    data: IProductCategory,
  ): Observable<{ message: string; data: IProductCategory }> {
    return this.http
      .patch<{ message: string; data: IProductCategory }>(
        `${environment.backend_url}/product-categories/${id}`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteProductCategory(id: string): Observable<{ message: string; data: IProductCategory }> {
    return this.http
      .delete<{ message: string; data: IProductCategory }>(
        `${environment.backend_url}/product-categories/${id}`,
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
