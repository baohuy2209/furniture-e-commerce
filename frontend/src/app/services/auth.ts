import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment.development';
import { ILogin, IUser } from '../../interface';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}
  getAccessToken() {
    return localStorage.getItem('auth_token');
  }
  setAccessToken(token: string) {
    localStorage.setItem('auth_token', token);
  }
  getRoles(): string[] {
    const rolesUser = localStorage.getItem('roles');
    if (!rolesUser) {
      return [];
    }
    return JSON.parse(rolesUser);
  }
  clearState() {
    localStorage.removeItem('auth_token');
  }

  login(email: string, password: string): Observable<{ data: ILogin; message: string }> {
    return this.http
      .post<{
        data: ILogin;
        message: string;
      }>(`${environment.backend_url}/auth/signin`, { email, password })
      .pipe(
        retry(2),
        tap((res: { data: ILogin; message: string }) => {
          this.setAccessToken(res.data.accessToken);
          localStorage.setItem('roles', JSON.stringify(res.data.roles));
        }),
        catchError(this.handleError),
      );
  }
  register(
    email: string,
    password: string,
    fullname: string,
    phone: string,
  ): Observable<{ message: string; data: IUser }> {
    return this.http
      .post<{
        message: string;
        data: IUser;
      }>(`${environment.backend_url}/auth/signup`, { email, password, fullname, phone })
      .pipe(retry(2), catchError(this.handleError));
  }
  logout(): Observable<{ message: string }> {
    this.clearState();
    return this.http
      .post<{ message: string }>(`${environment.backend_url}/auth/logout`, {})
      .pipe(retry(2), catchError(this.handleError));
  }
  forgotPassword(email: string): Observable<{ message: string; data: { email: string } }> {
    return this.http
      .post<{
        message: string;
        data: { email: string };
      }>(`${environment.backend_url}/auth/forgot-password`, { email })
      .pipe(retry(2), catchError(this.handleError));
  }
  checkOtp(otpCode: string): Observable<{ message: string; data: IUser }> {
    return this.http
      .post<{
        message: string;
        data: IUser;
      }>(`${environment.backend_url}/auth/reset-password/check-otp`, { otpCode })
      .pipe(retry(2), catchError(this.handleError));
  }
  verifyEmail(otpCode: String): Observable<{ message: string; data: IUser }> {
    return this.http
      .post<{
        message: string;
        data: IUser;
      }>(`${environment.backend_url}/auth/verify-email`, { otpCode })
      .pipe(retry(2), catchError(this.handleError));
  }
  resetPassword(userId: string, newPassword: string): Observable<{ message: string; data: IUser }> {
    return this.http
      .post<{
        message: string;
        data: IUser;
      }>(`${environment.backend_url}/auth/reset-password`, { userId, newPassword })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
