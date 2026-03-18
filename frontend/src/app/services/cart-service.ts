import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { ICart, ICartItem } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  constructor(private http: HttpClient) {}
  getCart(): Observable<{ message: string; data: ICart }> {
    return this.http
      .get<{ message: string; data: ICart }>(`${environment.backend_url}/cart`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  addToCart(
    product_variant_id: string,
    quantity: number,
  ): Observable<{ message: string; data: ICartItem }> {
    return this.http
      .post<{ message: string; data: ICartItem }>(
        `${environment.backend_url}/add`,
        {
          product_variant_id,
          quantity,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  updateQuantity(item_id: string, quantity: number): Observable<{ message: string }> {
    return this.http
      .patch<{ message: string }>(
        `${environment.backend_url}/cart/update`,
        {
          item_id,
          quantity,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  removeItem(itemId: string): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${environment.backend_url}/cart/remove/${itemId}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  clearCart(): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${environment.backend_url}/cart/clear`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
