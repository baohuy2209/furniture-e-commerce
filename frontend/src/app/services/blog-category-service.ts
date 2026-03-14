import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IBlogCategory } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class BlogCategoryService {
  constructor(private http: HttpClient) {}
  getAllBlogCategories(): Observable<{ message: string; data: IBlogCategory[] }> {
    return this.http
      .get<{ message: string; data: IBlogCategory[] }>(
        `${environment.backend_url}/blog-categories`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailBlogCategory(id: string): Observable<{ message: string; data: IBlogCategory }> {
    return this.http
      .get<{ message: string; data: IBlogCategory }>(
        `${environment.backend_url}/blog-categories/${id}`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  updateBlogCategoy(
    data: IBlogCategory,
    id: string,
  ): Observable<{ message: string; data: IBlogCategory }> {
    return this.http
      .patch<{ message: string; data: IBlogCategory }>(
        `${environment.backend_url}/blog-categories/${id}`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  createNewBlogCategoy(data: IBlogCategory): Observable<{ message: string; data: IBlogCategory }> {
    return this.http
      .post<{ message: string; data: IBlogCategory }>(
        `${environment.backend_url}/blog-categories`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteBlogCategory(id: string): Observable<{ message: string; data: IBlogCategory }> {
    return this.http
      .delete<{ message: string; data: IBlogCategory }>(
        `${environment.backend_url}/blog-categories/${id}`,
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
