import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { catchError, Observable, retry, throwError } from 'rxjs';
import {
  IListProducts,
  Iproduct,
  Iproduct_variants,
  Iproduct_variants_image,
} from '../../interface';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Product {
  constructor(private httpClient: HttpClient) {}
  getAllProducts(): Observable<{ message: string; data: IListProducts[] }> {
    return this.httpClient
      .get<{ message: string; data: IListProducts[] }>(`${environment.backend_url}/products`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getNewProducts(): Observable<{ message: string; data: IListProducts[] }> {
    return this.httpClient
      .get<{ message: string; data: IListProducts[] }>(
        `${environment.backend_url}/products/news-product`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getBestSellerProduct(): Observable<{ message: string; data: IListProducts[] }> {
    return this.httpClient
      .get<{ message: string; data: IListProducts[] }>(
        `${environment.backend_url}/products/best-seller-product`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getProductDetail(id: string): Observable<{
    message: string;
    data: {
      productInfo: Iproduct;
      defaultProductVariant: Iproduct_variants;
      listMainImageDefaultProduct: Iproduct_variants_image[];
    };
  }> {
    return this.httpClient
      .get<{
        message: string;
        data: {
          productInfo: Iproduct;
          defaultProductVariant: Iproduct_variants;
          listMainImageDefaultProduct: Iproduct_variants_image[];
        };
      }>(`${environment.backend_url}/products/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => new Error(err.message));
  }
}
