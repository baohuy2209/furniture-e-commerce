import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { Iproduct_variants } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ProductVariantService {
  constructor(private http: HttpClient) {}
  getAllVariantByProductId(
    product_id: string,
  ): Observable<{ message: string; data: Iproduct_variants[] }> {
    return this.http
      .get<{ message: string; data: Iproduct_variants[] }>(
        `${environment.backend_url}/product-variant/products/${product_id}`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailProductVariant(
    product_variant_id: string,
  ): Observable<{ message: string; data: Iproduct_variants }> {
    return this.http
      .get<{ message: string; data: Iproduct_variants }>(
        `${environment.backend_url}/product-variant/${product_variant_id}`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getDefaultVariantProduct(
    product_id: string,
  ): Observable<{ message: string; data: Iproduct_variants }> {
    return this.http
      .get<{ message: string; data: Iproduct_variants }>(
        `${environment.backend_url}/product-variant/${product_id}/default`,
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
