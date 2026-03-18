import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductColors {
  url = 'assets/data/color.json';
  constructor(private http: HttpClient) {}
  getAllColors(): Observable<{ name: string; hex: string }[]> {
    return this.http
      .get<{ name: string; hex: string }[]>(`${this.url}`)
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => new Error(err.message));
  }
}
