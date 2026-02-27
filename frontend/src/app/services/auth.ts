import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor() {}

  login(): void {}

  logout(): void {}
  register(): void {}
  handleError(err: HttpErrorResponse) {
    return throwError(() => new Error(err.message));
  }
}
