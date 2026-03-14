import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IListProducts, Iproduct_variants } from '../../interface';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Product {
  private product_variant_link: string = environment.products_url.product_variants;
  private product_image_link: string = environment.products_url.product_image;
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
  getAllProductVariants(): Observable<Iproduct_variants[]> {
    return this.httpClient
      .get<Iproduct_variants[]>(this.product_variant_link, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }

  handleError(err: HttpErrorResponse) {
    return throwError(() => new Error(err.message));
  }
}
