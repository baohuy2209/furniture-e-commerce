import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IAdminStockItem, IStockItem } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class StockItemService {
  constructor(private http: HttpClient) {}
  getAllStockItems(): Observable<{ message: string; data: IAdminStockItem[] }> {
    return this.http
      .get<{
        message: string;
        data: IAdminStockItem[];
      }>(`${environment.backend_url}/stock-items`, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailStockItem(stockItemId: string): Observable<{ message: string; data: IAdminStockItem }> {
    return this.http
      .get<{
        message: string;
        data: IAdminStockItem;
      }>(`${environment.backend_url}/stock-items/${stockItemId}`, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  getStockItemByProductVariantId(
    productVariantId: string,
  ): Observable<{ message: string; data: IStockItem }> {
    return this.http
      .get<{
        message: string;
        data: IStockItem;
      }>(`${environment.backend_url}/stock-items/product-variant-id/${productVariantId}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  createNewStockItem(data: IStockItem): Observable<{ message: string; data: IStockItem }> {
    return this.http
      .post<{
        message: string;
        data: IStockItem;
      }>(`${environment.backend_url}/stock-items`, data, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
