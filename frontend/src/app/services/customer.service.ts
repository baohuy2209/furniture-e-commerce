import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api/admins/customers';

  getStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`, { withCredentials: true });
  }

  getCustomers(query: any): Observable<any> {
    let params = new HttpParams();
    Object.keys(query).forEach(key => {
      if (query[key] !== null && query[key] !== undefined && query[key] !== '') {
        params = params.set(key, query[key]);
      }
    });
    return this.http.get(this.apiUrl, { params, withCredentials: true });
  }

  getCustomerDetail(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`, { withCredentials: true });
  }

  getCustomerOrders(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/orders`, { withCredentials: true });
  }

  getCustomerPoints(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/points`, { withCredentials: true });
  }

  updateCustomerStatus(id: string, status: 'active' | 'locked'): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/status`, { status }, { withCredentials: true });
  }
}
