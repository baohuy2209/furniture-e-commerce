import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { Iproduct, IReview } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  constructor(private http: HttpClient) {}
  createReviewProduct(
    rating: number,
    comments: string,
    images: File[],
    orderItemId: string,
  ): Observable<{ message: string; data: IReview }> {
    const formData = new FormData();
    formData.append('rating', rating.toString());
    formData.append('comments', comments);
    formData.append('orderItemId', orderItemId);
    for (let i = 0; i < images.length; i++) {
      formData.append('images', images[i]);
    }
    return this.http
      .post<{ message: string; data: IReview }>(`${environment.backend_url}/reviews`, formData, {
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
  getReviewsByUser(): Observable<{
    message: string;
    data: (Omit<IReview, 'product_id'> & { product_id: Iproduct })[];
  }> {
    return this.http
      .get<{ message: string; data: (Omit<IReview, 'product_id'> & { product_id: Iproduct })[] }>(
        `${environment.backend_url}/reviews/user`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getNewsReviewByAdmin(): Observable<{ message: string; data: IReview[] }> {
    return this.http
      .get<{ message: string; data: IReview[] }>(
        `${environment.backend_url}/reviews/admin/news-review`,
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
