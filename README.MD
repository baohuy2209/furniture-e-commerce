# Sơ đồ thư mục của phía client

```text
frontend/
├─ .angular/
├─ .vscode/
├─ node_modules/
├─ public/
├─ src/
│ ├─ app/
│ │ ├─ admins/
│ │ │ ├─ components/
│ │ │ └─ pages/
│ │ │ | ├─ general-dashboard/
│ │ │ | ├─ management-contents/
│ │ │ | ├─ management-customers/
│ │ │ | ├─ management-events/
│ │ │ | ├─ management-orders/
│ │ │ | ├─ management-products/
│ │ │ | ├─ management-voucher/
│ │ │ | ├─ management-warehouse/
│ │ │ | ├─ management-warranty/
│ │ │ | ├─ reports/
│ │ │ | └─ support-customers/
│ │ │
│ │ ├─ components/
│ │ │ ├─ account-settings/
│ │ │ | ├─ header-profile/
│ │ │ | ├─ settings-breadcrumb/
│ │ │ | ├─ settings-sidebar/
│ │ │ ├─ card-product/
│ │ | ├─ home/
│ │ │ | ├─ best-seller-products/
│ │ │ | ├─ blog-section/
│ │ │ | ├─ faq/
│ │ │ | ├─ features/
│ │ │ | ├─ hero-section/
│ │ │ | ├─ new-product/
│ │ │ | └─ testimonial/
│ │ │
│ │ | ├─ layout/
│ │ │ | ├─ admin-layout/
│ │ │ | ├─ auth-layout/
│ │ │ | ├─ client-layout/
│ │ │ | ├─ footer/
│ │ │ | ├─ header/
│ │ │ | └─ setting-layout/
│ │ ├─ pages/
│ │ │ ├─ blogs/
│ │ │ ├─ blogs-details/
│ │ │ ├─ cart/
│ │ │ ├─ change-password/
│ │ │ ├─ events/
│ │ │ ├─ home/
│ │ │ ├─ my-orders/
│ │ │ ├─ my-payment-method/
│ │ │ ├─ my-promotions/
│ │ │ ├─ my-reviews/
│ │ │ ├─ policy/
│ │ │ ├─ product-details/
│ │ │ ├─ products/
│ │ │ ├─ requests-warranty/
│ │ │ ├─ sign-in/
│ │ │ ├─ sign-up/
│ │ │ ├─ support/
│ │ │ ├─ user-profile/
│ │ │ ├─ user-settings/
│ │ │ └─ verify-email/
│ │ │
│ │ ├─ app.config.ts
│ │ ├─ app.css
│ │ ├─ app.html
│ │ ├─ app.routes.ts
│ │ └─ app.ts
│ │ ├─ services
│ ├─ assets/
│ │ ├─ data/
│ │ │ ├─ color.json
│ │ │ ├─ fabric_name.json
│ │ │ ├─ material.json
│ │ │ ├─ product_image.json
│ │ │ ├─ product_variants.json
│ │ │ ├─ product.json
│ │ │ └─ upholstery.json
│ │ └─ home/
│ │
│ ├─ interface/
│ │ └─ index.ts
│ │
│ ├─ index.html
│ ├─ main.ts
│ └─ styles.css
│
└─ .editorconfig

## 1️⃣ Frontend (Client – Angular)

### 📂 `frontend/`

Thư mục gốc của phía client, xây dựng bằng **Angular**, chịu trách nhiệm giao diện người dùng (UI/UX) cho cả **khách hàng** và **quản trị viên**.

---

### 📂 `.angular/`

- Thư mục nội bộ do Angular CLI sinh ra.
- Lưu cache build, metadata phục vụ quá trình phát triển.
- ❌ Không chỉnh sửa thủ công.

---

### 📂 `.vscode/`

- Chứa cấu hình dành riêng cho VS Code:
  - Format code
  - Debug
  - Extensions gợi ý cho dự án

---

### 📂 `node_modules/`

- Chứa toàn bộ thư viện được cài bằng `npm`.
- ❌ Không commit lên Git.

---

### 📂 `public/`

- Chứa các tài nguyên public tĩnh (favicon, robots.txt, assets dùng chung…).
- Được truy cập trực tiếp từ trình duyệt.

---

### 📂 `src/`

Thư mục chính của frontend, chứa toàn bộ source code Angular.

---

## 📦 `src/app/`

Chứa các module, component, page và cấu hình cốt lõi của ứng dụng.

---

### 👨‍💼 `admins/`

Chứa **toàn bộ chức năng dành cho quản trị viên**.

#### 🔹 `admins/components/`

- Component dùng riêng cho admin (bảng, modal, form quản trị…)

#### 🔹 `admins/pages/`

- Các trang quản trị:
  - `general-dashboard` – Tổng quan hệ thống
  - `management-products` – Quản lý sản phẩm
  - `management-orders` – Quản lý đơn hàng
  - `management-customers` – Quản lý khách hàng
  - `management-warehouse` – Quản lý kho
  - `management-warranty` – Quản lý bảo hành
  - `management-voucher` – Quản lý khuyến mãi
  - `reports` – Báo cáo & thống kê
  - `support-customers` – Hỗ trợ khách hàng

---

### 🧩 `components/`

Các **component tái sử dụng** trong toàn bộ ứng dụng client.

- `account-settings` – Chứa các thành phần trong trang settings của người dùng
- `header-profile` – Thành phần trong trang settings - Phần header người dùng trong trang setting
- `settings-sidebar` – Thành phần trong trang settings - sidebar trong trang settings
- `settings-breadcrumb` - Thành phần trong trang settings - Phần breadcrumbs giúp chuyển đổi qua lại giữa các trang
- `card-product` – Thẻ hiển thị sản phẩm ở trang sản phẩm

---

### 🏠 `home/`

Các component dùng riêng cho **trang chủ**:

- `hero-section`
- `best-seller-products`
- `new-product`
- `testimonial`
- `faq`
- `blog-section`

---

### 🧱 `layout/`

Định nghĩa layout cho từng khu vực:

- `admin-layout` – Giao diện admin
- `client-layout` – Giao diện người dùng
- `auth-layout` – Đăng nhập / đăng ký
- `setting-layout` – Cài đặt người dùng
- `header` / `footer`

---

### 📄 `pages/`

Các trang chính của người dùng:

- `home` - Trang chủ
- `products` - Trang sản phẩm
- `product-details` - Trang sản phẩm chi tiết
- `cart` - Trang giỏ hàng
- `blogs` / `blogs-details` - Trang bài viết và chi tiết bài viết
- `sign-in` / `sign-up` - Trang đăng nhập, đăng kí
- `user-profile` - Trang thông tin cá nhân người dùng
- `my-orders` - Trang các đơn đặt hàng của người dùng
- `my-promotions` - Trang các sản phẩm khuyến mãi
- `my-reviews` - Trang đánh giá của khách hàng
- `policy` - Trang các chính sách bảo mật và quyền riêng tư
- `requests-warranty` - Trang yêu cầu bảo hành
- `support` - Trang liên hệ, giải đáp thắc mắc
- `verify-email` - Trang xác nhận email
- `change-password` - Trang thay đổi mật khẩu
- `my-payment-method` - Phương thức thanh toán của khách hàng

---

### ⚙️ File cấu hình App

| File            | Mô tả             |
| --------------- | ----------------- |
| `app.config.ts` | Cấu hình ứng dụng |
| `app.routes.ts` | Routing chính     |
| `app.ts`        | Root component    |
| `app.html`      | Template gốc      |
| `app.css`       | Style gốc         |

---

## 📂 `src/app/services`

Chứa các API kết nối backend tương ứng cho từng thực thể

## 📂 `src/assets/`

Chứa tài nguyên tĩnh.

### 🔹 `data/`

- File JSON giả lập dữ liệu:
  - sản phẩm
  - màu sắc
  - vật liệu
  - biến thể

### 🔹 `home/`

- Ảnh và tài nguyên dùng cho trang chủ

---

### 📂 `src/interface/`

- Định nghĩa các **TypeScript interface**
- Giúp type-safe khi gọi API

---

### 📄 File gốc

| File         | Vai trò           |
| ------------ | ----------------- |
| `index.html` | Entry HTML        |
| `main.ts`    | Bootstrap Angular |
| `styles.css` | Global styles     |

---

# Sơ đồ thư mục phía server

backend/
├── app/
│ ├── config/
│ ├── controllers/
│ ├── models/
├── constants/
├── middlewares/
├── node_modules/
├── routes/
├── services/
├── utils/
├── .env
├── .gitignore
├── package-lock.json
├── package.json
├── server.js
└── swagger.json

---

2️⃣ Backend (Server – Node.js / Express)
📂 backend/

Chứa toàn bộ logic phía server, API và kết nối cơ sở dữ liệu.

📂 app/

Thư mục lõi theo mô hình MVC.

🔹 config/

Cấu hình hệ thống:

database

swagger

env

🔹 controllers/

Nhận request từ client

Validate input

Gọi service xử lý nghiệp vụ

🔹 models/

Định nghĩa schema dữ liệu (MongoDB / Sequelize / Mongoose…)

📂 constants/

Lưu các hằng số dùng chung:

HTTP status

message response

role, permission

📂 middlewares/

Middleware Express:

Auth

JWT

Error handling

Logging

📂 routes/

Định nghĩa API endpoint

Mapping route → controller

📂 services/

Xử lý nghiệp vụ chính

Logic phức tạp (order, payment, warehouse…)

📂 utils/

Hàm tiện ích:

format response

logger

upload file

pagination

📄 File cấu hình
| File | Mô tả |
| -------------- | --------------- |
| `.env` | Biến môi trường |
| `server.js` | Entry server |
| `swagger.json` | Tài liệu API |
| `package.json` | Dependencies |

---

## ✅ Tổng kết kiến trúc

- **Frontend**: Component-based, tách rõ Admin & Client
- **Backend**: MVC + Service Layer
- **Dễ mở rộng – dễ bảo trì – chuẩn đồ án & sản phẩm thật**
