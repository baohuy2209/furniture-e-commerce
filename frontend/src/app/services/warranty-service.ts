import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, retry, throwError } from 'rxjs';
import { IUser, IWarrantyRequest } from '../../interface';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class WarrantyService {
  constructor(private httpClient: HttpClient) {}
  createWarranty(
    fullname: string,
    email: string,
    phone: string,
    issue_description: string,
    production_variant_id: string,
    files: File[],
  ): Observable<{ message: string; data: IWarrantyRequest }> {
    const formData = new FormData();

    // Append các field text
    formData.append('fullname', fullname);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('issue_description', issue_description);
    formData.append('production_variant_id', production_variant_id);

    // Append files
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    return this.httpClient
      .post<{
        message: string;
        data: IWarrantyRequest;
      }>(`${environment.backend_url}/warranties`, formData, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  getUserWarranty() {
    return this.httpClient
      .get<{
        message: string;
        data: IWarrantyRequest[];
      }>(`${environment.backend_url}/warranties/user`, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  getAllWarranty(): Observable<{
    message: string;
    data: (Omit<IWarrantyRequest, 'user_id'> & { user_id: IUser })[];
  }> {
    return this.httpClient
      .get<{
        message: string;
        data: (Omit<IWarrantyRequest, 'user_id'> & { user_id: IUser })[];
      }>(`${environment.backend_url}/warranties`, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  getDetailWarranty(warrantyId: string): Observable<{
    message: string;
    data: (Omit<IWarrantyRequest, 'user_id'> & { user_id: IUser; images: string[] })[];
  }> {
    return this.httpClient
      .get<{
        message: string;
        data: (Omit<IWarrantyRequest, 'user_id'> & { user_id: IUser; images: string[] })[];
      }>(`${environment.backend_url}/warranties/${warrantyId}`, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  updateWarrantyStatus(
    warrantyId: string,
    warranty_status: string,
    resolution_note: string,
    approve_by: string = 'Nguyễn Bảo Huy',
  ) {
    return this.httpClient
      .patch<{
        message: string;
        data: IWarrantyRequest;
      }>(
        `${environment.backend_url}/warranties/${warrantyId}`,
        { warranty_status, resolution_note, approve_by },
        { withCredentials: true },
      )
      .pipe(retry(2), catchError(this.handleError));
  }
  deleteWarranty(warrantyId: string): Observable<{ message: string }> {
    return this.httpClient
      .delete<{
        message: string;
      }>(`${environment.backend_url}/warranties/${warrantyId}`, { withCredentials: true })
      .pipe(retry(2), catchError(this.handleError));
  }
  handleError(err: HttpErrorResponse) {
    return throwError(() => new Error(err.message));
  }
}
