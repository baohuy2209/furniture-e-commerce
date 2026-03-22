import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminOrderService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/api/admins/orders';

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/statistics`, { withCredentials: true }).pipe(map((res) => res.data));
  }

  getOrders(params: any): Observable<any> {
    return this.http.get<any>(this.baseUrl, { params, withCredentials: true }).pipe(map((res) => res.data));
  }

  getOrderDetail(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${id}`, { withCredentials: true }).pipe(map((res) => res.data));
  }

  updateOrderNote(id: string, admin_note: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/note`, { admin_note }, { withCredentials: true }).pipe(map((res) => res.data));
  }

  updateOrderStatus(id: string, status: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, { status }, { withCredentials: true }).pipe(map((res) => res.data));
  }
}
