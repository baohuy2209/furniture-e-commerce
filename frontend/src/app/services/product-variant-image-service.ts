import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, retry, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { Iproduct_variants_image } from '../../interface';

@Injectable({
  providedIn: 'root',
})
export class ProductVariantImageService {
  constructor(private http: HttpClient) {}
  getAllImageByProductVariantId(
    productVariantId: string,
  ): Observable<{ message: string; data: Iproduct_variants_image[] }> {
    return this.http.get<{ message: string; data: Iproduct_variants_image[] }>(
      `${environment.backend_url}/product-variant-image//product-variants/${productVariantId}`,
    );
  }
  getDefaultImageByProductVariantId(
    productVariantId: string,
  ): Observable<{ message: string; data: Iproduct_variants_image }> {
    return this.http.get<{ message: string; data: Iproduct_variants_image }>(
      `${environment.backend_url}/product-variant-image/product-variants/default/${productVariantId}`,
    );
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
