import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IBlogTag } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class BlogTagsService {
  constructor(private http: HttpClient) {}
  getAllBlogTags(): Observable<{ message: string; data: IBlogTag[] }> {
    return this.http
      .get<{ message: string; data: IBlogTag[] }>(`${environment.backend_url}/blog-tags`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  createNewsBlogTags(data: IBlogTag): Observable<{ message: string; data: IBlogTag }> {
    return this.http
      .post<{ message: string; data: IBlogTag }>(`${environment.backend_url}/blog-tags`, data, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailBlogTags(id: string): Observable<{ message: string; data: IBlogTag }> {
    return this.http
      .get<{ message: string; data: IBlogTag }>(`${environment.backend_url}/blog-tags/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  updateBlogTag(id: string, data: IBlogTag): Observable<{ message: string; data: IBlogTag }> {
    return this.http
      .patch<{ message: string; data: IBlogTag }>(
        `${environment.backend_url}/blog-tags/${id}`,
        data,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteBlogTag(id: string): Observable<{ message: string; data: IBlogTag }> {
    return this.http
      .delete<{ message: string; data: IBlogTag }>(`${environment.backend_url}/blog-tags/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
