import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { IProductTag } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ProductTagsService {
  constructor(private http: HttpClient) {}
  getAllProductsTags(): Observable<{ message: string; data: IProductTag[] }> {
    return this.http.get<{ message: string; data: IProductTag[] }>(
      `${environment.backend_url}/products-tags`,
      {
        withCredentials: true,
      },
    );
  }
  createNewProductTags(data: IProductTag): Observable<{ message: string; data: IProductTag }> {
    return this.http.post<{ message: string; data: IProductTag }>(
      `${environment.backend_url}/products-tags`,
      data,
      {
        withCredentials: true,
      },
    );
  }
  updateProductTags(
    data: IProductTag,
    id: string,
  ): Observable<{ message: string; data: IProductTag }> {
    return this.http.patch<{ message: string; data: IProductTag }>(
      `${environment.backend_url}/products-tags/${id}`,
      data,
      {
        withCredentials: true,
      },
    );
  }
  deleteProductTags(id: string): Observable<{ message: string; data: IProductTag }> {
    return this.http.delete<{ message: string; data: IProductTag }>(
      `${environment.backend_url}/products-tags/${id}`,
      {
        withCredentials: true,
      },
    );
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
