import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.development';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { Iproduct, Iproduct_image, Iproduct_variants } from '../../interface';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Product {
  private product_link: string = environment.products_url.product;
  private product_variant_link: string = environment.products_url.product_variants;
  private product_image_link: string = environment.products_url.product_image;
  constructor(private httpClient: HttpClient) {}
  getAllProducts(): Observable<Iproduct[]> {
    return this.httpClient
      .get<Iproduct[]>(this.product_link)
      .pipe(retry(2), catchError(this.handleError));
  }
  getAllProductVariants(): Observable<Iproduct_variants[]> {
    return this.httpClient
      .get<Iproduct_variants[]>(this.product_variant_link)
      .pipe(retry(2), catchError(this.handleError));
  }
  getAllProductImage(): Observable<Iproduct_image[]> {
    return this.httpClient
      .get<Iproduct_image[]>(this.product_image_link)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => new Error(err.message));
  }
}
