import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IUser } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}
  getUserInfo(): Observable<{ message: string; data: IUser }> {
    return this.http
      .get<{ message: string; data: IUser }>(`${environment.backend_url}/user`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  updateUserProfile(data: IUser): Observable<{ message: string; data: IUser }> {
    return this.http
      .patch<{ message: string; data: IUser }>(`${environment.backend_url}/user/profile`, data, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http
      .post<{ message: string }>(
        `${environment.backend_url}/user/change-password`,
        {
          oldPassword,
          newPassword,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteAccount(): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${environment.backend_url}/user`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
