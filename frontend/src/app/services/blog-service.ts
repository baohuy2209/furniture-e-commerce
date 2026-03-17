import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IBlog, IListBlog } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class BlogService {
  constructor(private httpClient: HttpClient) {}
  getAllBlogs(params: any): Observable<{ message: string; data: IListBlog[] }> {
    return this.httpClient
      .get<{ message: string; data: IListBlog[] }>(`${environment.backend_url}/blogs`, {
        withCredentials: true,
        params,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getTrendingBlogs(): Observable<{ message: string; data: IListBlog[] }> {
    return this.httpClient
      .get<{ message: string; data: IListBlog[] }>(
        `${environment.backend_url}/blogs/trending-blogs`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailBlog(id: string): Observable<{ message: string; data: IBlog }> {
    return this.httpClient
      .get<{ message: string; data: IBlog }>(`${environment.backend_url}/blogs/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => new Error(err.message));
  }
}
