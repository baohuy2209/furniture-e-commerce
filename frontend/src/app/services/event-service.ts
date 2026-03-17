import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IEvent } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(private http: HttpClient) {}
  getAllEvents(): Observable<{ message: string; data: IEvent[] }> {
    return this.http
      .get<{ message: string; data: IEvent[] }>(`${environment.backend_url}/events`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getAllPastEvents(): Observable<{ message: string; data: IEvent[] }> {
    return this.http
      .get<{ message: string; data: IEvent[] }>(`${environment.backend_url}/events/past-event`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getAllUpcommingEvents(): Observable<{ message: string; data: IEvent[] }> {
    return this.http
      .get<{ message: string; data: IEvent[] }>(
        `${environment.backend_url}/events/upcoming-event`,
        {
          withCredentials: true,
        },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  getAllCurrentEvents(): Observable<{ message: string; data: IEvent[] }> {
    return this.http
      .get<{ message: string; data: IEvent[] }>(`${environment.backend_url}/events/current-event`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailEvent(id: string): Observable<{ message: string; data: IEvent }> {
    return this.http
      .get<{ message: string; data: IEvent }>(`${environment.backend_url}/events/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  createNewEvent(data: IEvent): Observable<{ message: string; data: IEvent }> {
    return this.http
      .post<{ message: string; data: IEvent }>(`${environment.backend_url}/events`, data, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  updateEvent(id: string, data: IEvent): Observable<{ message: string; data: IEvent }> {
    return this.http
      .patch<{ message: string; data: IEvent }>(`${environment.backend_url}/events/${id}`, data, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteEvent(id: string): Observable<{ message: string; data: IEvent }> {
    return this.http
      .delete<{ message: string; data: IEvent }>(`${environment.backend_url}/events/${id}`, {
        withCredentials: true,
      })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => err);
  }
}
