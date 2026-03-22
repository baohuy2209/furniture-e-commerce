import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IOrder, IOrderItem, IOrderItemShipping, IPayment } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class OrderServices {
  constructor(private http: HttpClient) {}
  checkout(
    address_id: string,
    shipping_method: string,
    shipping_fee: number,
    payment_method: string,
    note: string,
  ): Observable<{ message: string; data: IOrder }> {
    return this.http
      .post<{
        message: string;
        data: IOrder;
      }>(
        `${environment.backend_url}/orders/checkout`,
        { address_id, shipping_method, shipping_fee, payment_method, note },
        { withCredentials: true },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  checkoutWithoutLogin(
    user_id: string,
    product_variant_id: string,
    quantity: number,
    address_id: string,
    shipping_fee: number,
    note: string,
  ): Observable<{
    message: string;
    data: {
      order: IOrder;
      orderItem: IOrderItem;
      payment: IPayment;
      orderItemShipping: IOrderItemShipping;
    };
  }> {
    return this.http
      .post<{
        message: string;
        data: {
          order: IOrder;
          orderItem: IOrderItem;
          payment: IPayment;
          orderItemShipping: IOrderItemShipping;
        };
      }>(
        `${environment.backend_url}/orders/checkout-without-login`,
        {
          user_id,
          product_variant_id,
          quantity,
          address_id,
          shipping_fee,
          note,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getUserOrders(): Observable<{
    message: string;
    data: IOrder[];
  }> {
    return this.http
      .get<{
        message: string;
        data: IOrder[];
      }>(`${environment.backend_url}/orders`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getOrderDetail(id: string): Observable<{
    message: string;
    data: {
      order: IOrder;
      items: { item: IOrderItem; shipping: IOrderItemShipping; payment: IPayment }[];
    };
  }> {
    return this.http
      .get<{
        message: string;
        data: {
          order: IOrder;
          items: { item: IOrderItem; shipping: IOrderItemShipping; payment: IPayment }[];
        };
      }>(`${environment.backend_url}/orders/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  cancelOrder(cancel_reason: string, id: string): Observable<{ message: string; data: IOrder }> {
    return this.http
      .put<{
        message: string;
        data: IOrder;
      }>(`${environment.backend_url}/orders/${id}`, { cancel_reason }, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  getAllOrdersAdmin(): Observable<{ message: string; data: IOrder[] }> {
    return this.http
      .get<{
        message: string;
        data: IOrder[];
      }>(`${environment.backend_url}/orders/admin/all`, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  getOrderDetailAdmin(id: string): Observable<{ message: string; data: IOrder }> {
    return this.http
      .get<{
        message: string;
        data: IOrder;
      }>(`${environment.backend_url}/orders/admin/${id}`, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  updateOrderItemStatus(
    orderItemId: string,
    status: string,
  ): Observable<{ message: string; data: IOrderItem }> {
    return this.http
      .put<{ message: string; data: IOrderItem }>(
        `${environment.backend_url}/orders/admin/item-status/${orderItemId}`,
        { status },
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  updatePaymentStatus(
    paymentId: string,
    status: string,
  ): Observable<{ message: string; data: IOrderItem }> {
    return this.http
      .put<{ message: string; data: IOrderItem }>(
        `${environment.backend_url}/orders/admin/payment-status/${paymentId}`,
        { status },
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
