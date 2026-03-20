export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface IToast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
  hiding?: boolean;
}
