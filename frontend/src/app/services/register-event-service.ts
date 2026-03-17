import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IRegisterEvent } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class RegisterEventService {
  constructor(private http: HttpClient) {}
  registerEvents(
    event_id: string,
    fullname: string,
    email: string,
    phone: string,
    note: string,
  ): Observable<{ message: string; data: IRegisterEvent }> {
    return this.http
      .post<{ message: string; data: IRegisterEvent }>(
        `${environment.backend_url}/register-events`,
        {
          event_id,
          fullname,
          email,
          phone,
          note,
        },
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getAllRegisterEvents(): Observable<{ message: string; data: IRegisterEvent[] }> {
    return this.http
      .get<{ message: string; data: IRegisterEvent[] }>(
        `${environment.backend_url}/register-events`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailRegisterEventInfo(id: string): Observable<{ message: string; data: IRegisterEvent }> {
    return this.http
      .get<{ message: string; data: IRegisterEvent }>(
        `${environment.backend_url}/register-events/${id}`,
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
