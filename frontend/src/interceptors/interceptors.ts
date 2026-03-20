import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../app/services/auth';
let isRefreshing = false;
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const accessToken = authService.getAccessToken();

  let authReq = req;

  // gắn accessToken vào header
  if (accessToken) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      // bỏ qua các API auth
      if (
        req.url.includes('/auth/signin') ||
        req.url.includes('/auth/signup') ||
        req.url.includes('/auth/refresh-token') ||
        req.url.includes('/auth/verify-email') ||
        req.url.includes('/auth/reset-password') ||
        req.url.includes('/auth/forgot-password') ||
        req.url.includes('/auth/reset-password/check-otp')
      ) {
        return throwError(() => error);
      }

      // token hết hạn
      if (error.status === 401 && !isRefreshing) {
        isRefreshing = true;
        return authService.refreshToken().pipe(
          switchMap((res: any) => {
            console.log(res.data);
            const newAccessToken = res.data;

            // lưu accessToken mới
            authService.setAccessToken(newAccessToken);

            // retry request cũ
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newAccessToken}`,
              },
            });

            return next(retryReq);
          }),

          catchError((refreshError) => {
            // refresh token cũng hết hạn
            authService.clearState();

            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
