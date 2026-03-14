import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IReview } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  constructor(private http: HttpClient) {}
  createReviewProduct(data: IReview): Observable<{ message: string; data: IReview }> {
    return this.http
      .post<{ message: string; data: IReview }>(`${environment.backend_url}/reviews`, data, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getReviewsByProduct(id: string): Observable<{ message: string; data: IReview[] }> {
    return this.http
      .get<{ message: string; data: IReview[] }>(
        `${environment.backend_url}/reviews/product/${id}`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getReviewsByUser(): Observable<{ message: string; data: IReview[] }> {
    return this.http
      .get<{ message: string; data: IReview[] }>(`${environment.backend_url}/reviews/user`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
