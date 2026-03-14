import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IBlogAuthor } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class BlogAuthorService {
  constructor(private http: HttpClient) {}
  getAllBlogAuthor(): Observable<{ message: string; data: IBlogAuthor[] }> {
    return this.http
      .get<{ message: string; data: IBlogAuthor[] }>(`${environment.backend_url}/blog-author`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailBlogAuthor(id: string): Observable<{ message: string; data: IBlogAuthor }> {
    return this.http
      .get<{ message: string; data: IBlogAuthor }>(`${environment.backend_url}/blog-author/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
