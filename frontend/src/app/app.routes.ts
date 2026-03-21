import { Routes } from '@angular/router';
import { ClientLayout } from './components/layout/client-layout/client-layout';
import { AuthLayout } from './components/layout/auth-layout/auth-layout';
import { SettingLayout } from './components/layout/setting-layout/setting-layout';
import { AdminLayout } from './components/layout/admin-layout/admin-layout';
import { EventsLayout } from './components/layout/events-layout/events-layout';
import { authGuard } from './guards/auth-guard';
export const routes: Routes = [
  {
    path: '',
    component: ClientLayout,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/about-us/about-us').then((m) => m.AboutUs),
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
      {
        path: 'products',
        loadComponent: () => import('./pages/products/products').then((m) => m.Products),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./pages/product-details/product-details').then((m) => m.ProductDetails),
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/cart/cart').then((m) => m.Cart),
        canActivate: [authGuard],
      },
      {
        path: 'checkout',
        loadComponent: () => import('./pages/checkout/checkout').then((m) => m.Checkout),
        canActivate: [authGuard],
      },
      {
        path: 'blogs',
        loadComponent: () => import('./pages/blogs/blogs').then((m) => m.Blogs),
      },
      {
        path: 'blogs/:id',
        loadComponent: () =>
          import('./pages/blogs-details/blogs-details').then((m) => m.BlogsDetails),
      },
      {
        path: 'upholstery',
        loadComponent: () => import('./pages/upholstery/upholstery').then((m) => m.Upholstery),
      },
    ],
  },
  {
    path: 'events',
    component: EventsLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/events/events').then((m) => m.Events),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./pages/event-page-details/event-page-details').then((m) => m.EventPageDetails),
      },
    ],
  },
  {
    path: 'auth',
    component: AuthLayout,
    children: [
      {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full',
      },
      {
        path: 'sign-in',
        loadComponent: () => import('./pages/sign-in/sign-in').then((m) => m.SignIn),
      },
      {
        path: 'sign-up',
        loadComponent: () => import('./pages/sign-up/sign-up').then((m) => m.SignUp),
      },
      {
        path: 'verify-email',
        loadComponent: () => import('./pages/verify-email/verify-email').then((m) => m.VerifyEmail),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./pages/forgot-password/forgot-password').then((m) => m.ForgotPassword),
      },
    ],
  },
  {
    path: 'settings',
    component: SettingLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/user-profile/user-profile').then((m) => m.UserProfile),
      },
      {
        path: 'my-orders',
        loadComponent: () => import('./pages/my-orders/my-orders').then((m) => m.MyOrders), // <== CẦN TẠO COMPONENT NÀY
      },
      {
        path: 'my-reviews',
        loadComponent: () => import('./pages/my-reviews/my-reviews').then((m) => m.MyReviews), // <== CẦN TẠO COMPONENT NÀY
      },
      {
        path: 'change-password',
        loadComponent: () =>
          import('./pages/change-password/change-password').then((m) => m.ChangePassword),
      },
      {
        path: 'user-setting',
        loadComponent: () =>
          import('./pages/user-settings/user-settings').then((m) => m.UserSettings),
      },
      {
        path: 'my-promotions',
        loadComponent: () =>
          import('./pages/my-promotions/my-promotions').then((m) => m.MyPromotions),
      },
      {
        path: 'my-payment-method',
        loadComponent: () =>
          import('./pages/my-payment-method/my-payment-method').then((m) => m.MyPaymentMethod),
      },
      {
        path: 'policy',
        loadComponent: () => import('./pages/policy/policy').then((m) => m.Policy),
      },
      {
        path: 'requests-warranty',
        loadComponent: () =>
          import('./pages/requests-warranty/requests-warranty').then((m) => m.RequestsWarranty),
      },
      {
        path: 'support',
        loadComponent: () => import('./pages/support/support').then((m) => m.Support),
      },
    ],
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: AdminLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./admins/pages/general-dashboard/general-dashboard').then(
            (m) => m.GeneralDashboard,
          ),
      },
      {
        path: 'management-customers',
        loadComponent: () =>
          import('./admins/pages/management-customers/management-customers').then(
            (m) => m.ManagementCustomers,
          ),
      },
      {
        path: 'management-products',
        loadComponent: () =>
          import('./admins/pages/management-products/management-products').then(
            (m) => m.ManagementProducts,
          ),
      },
      {
        path: 'management-orders',
        loadComponent: () =>
          import('./admins/pages/management-orders/management-orders').then(
            (m) => m.ManagementOrders,
          ),
      },
      {
        path: 'management-warranty',
        loadComponent: () =>
          import('./admins/pages/management-warranty/management-warranty').then(
            (m) => m.ManagementWarranty,
          ),
      },
      {
        path: 'management-contents',
        loadComponent: () =>
          import('./admins/pages/management-contents/management-contents').then(
            (m) => m.ManagementContents,
          ),
      },
      {
        path: 'management-events',
        loadComponent: () =>
          import('./admins/pages/management-events/management-events').then(
            (m) => m.ManagementEvents,
          ),
      },
      {
        path: 'support-customers',
        loadComponent: () =>
          import('./admins/pages/support-customers/support-customers').then(
            (m) => m.SupportCustomers,
          ),
      },
      {
        path: 'reports',
        loadComponent: () => import('./admins/pages/reports/reports').then((m) => m.Reports),
      },
      {
        path: 'management-warehouse',
        loadComponent: () =>
          import('./admins/pages/management-warehouse/management-warehouse').then(
            (m) => m.ManagementWarehouse,
          ),
      },
    ],
  },
];
