
# PHẦN I: MỞ ĐẦU

## 1. Tên đề tài

**"Xây dựng Hệ thống Backend Quản lý Thư viện Nhạc cụ & Phòng tập (Music Studio Manager)"**

**"Link Video Demo:https://drive.google.com/file/d/182MNBWVa5hPz9uI5h2xefPZsd4mTfQXt/view?usp=sharing"**

## 2. Tính cấp thiết của đề tài

Trong bối cảnh hiện nay, nhu cầu học tập và giải trí âm nhạc ngày càng gia tăng, kéo theo sự phát triển của các trung tâm âm nhạc, phòng thu và dịch vụ cho thuê nhạc cụ. Tuy nhiên, công tác quản lý tại nhiều cơ sở vẫn còn mang tính thủ công, dẫn đến nhiều hạn chế:

-   **Vấn đề quản lý phòng tập:**  
    Việc đặt lịch phòng chủ yếu thực hiện thủ công, dễ xảy ra tình trạng trùng lịch, gây ảnh hưởng đến trải nghiệm khách hàng
    
-   **Vấn đề quản lý nhạc cụ:**  
    Các nhạc cụ có giá trị cao như Piano, Violin, Guitar khó kiểm soát tình trạng và lịch sử sử dụng
    
-   **Vấn đề theo dõi tài sản:**  
    Không có hệ thống ghi nhận tình trạng trước và sau khi sử dụng
    
-   **Vấn đề quản trị dữ liệu:**  
    Thiếu hệ thống lưu trữ tập trung
    

**Giải pháp:**  
Xây dựng hệ thống Backend quản lý tập trung giúp tự động hóa quy trình.

## 3. Mục tiêu đề tài

1.  Thiết kế cơ sở dữ liệu (~9 bảng)
    
2.  Xây dựng API Backend đầy đủ chức năng
    
3.  Chống trùng lịch (Conflict Resolution)
    
4.  Quản lý tình trạng tài sản (Asset Condition)
    
5.  Báo cáo & thống kê
    
6.  Bảo mật và phân quyền
    

## 4. Phạm vi công việc

### Phạm vi dữ liệu

-   Người dùng
    
-   Phòng tập
    
-   Nhạc cụ
    
-   Lịch đặt
    
-   Mượn/trả
    
-   Tình trạng tài sản
    

### Phạm vi chức năng

-   Quản lý user
    
-   Quản lý phòng
    
-   Quản lý nhạc cụ
    
-   Đặt lịch
    
-   Mượn/trả
    
-   Báo cáo
    

### Phạm vi công nghệ

-   Backend: Node.js + Express
    
-   Database: SQL Server / MySQL
    
-   API: RESTful
    

----------

# PHẦN II: PHÂN TÍCH YÊU CẦU HỆ THỐNG

## 1. Đối tượng sử dụng

### 4. Đối tượng sử dụng và Nhu cầu
```

| Nhóm | Vai trò | Nhu cầu |
| :--- | :--- | :--- |
| **Người dùng** | Thuê phòng | Đặt lịch nhanh chóng, tiện lợi |
| **Nhân viên** | Quản lý | Theo dõi hệ thống, kiểm soát thiết bị |
| **Admin** | Quản trị | Toàn quyền cấu hình và quản lý dữ liệu |

## 2. Yêu cầu chức năng

### Nhóm A: Quản lý cơ bản

-   CRUD Users
    
-   CRUD Rooms
    
-   CRUD Instruments
    
-   Phân quyền
    

### Nhóm B: Đặt lịch

-   Đặt phòng
    
-   Check trùng lịch
    
-   Quản lý booking
    
-   Mượn/trả
    

### Nhóm C: Tài sản & Báo cáo

-   Ghi nhận tình trạng
    
-   Tính phí
    
-   Báo cáo:
    
    -   Doanh thu
        
    -   Tần suất
        
    -   Trạng thái
        

----------
```
# PHẦN III: THIẾT KẾ CƠ SỞ DỮ LIỆU

## 1. ERD (Tóm tắt)

-   Roles → Users
    
-   Rooms → Bookings
    
-   Instruments → Rentals
    
-   Rentals → Return
    
-   Conditions → Rentals
    

## 2. Các bảng dữ liệu

### Users
```sql
 
CREATE  TABLE users (  
 id INT  PRIMARY  KEY  IDENTITY,  
 username NVARCHAR(100),  
 password NVARCHAR(255),  
 role_id INT  
);

### Roles

INSERT  INTO roles VALUES ('admin'), ('staff'), ('customer');

### Rooms

CREATE  TABLE rooms (  
 id INT  PRIMARY  KEY,  
 name NVARCHAR(100),  
 capacity INT,  
 hourly_rate DECIMAL  
);

### Bookings

CREATE  TABLE bookings (  
 id INT  PRIMARY  KEY,  
 room_id INT,  
 start_time DATETIME,  
 end_time DATETIME  
);

### Instruments

CREATE  TABLE instruments (  
 id INT  PRIMARY  KEY,  
 name NVARCHAR(100),  
 status NVARCHAR(20)  
);

### Rentals

CREATE  TABLE rentals (  
 rental_id INT  PRIMARY  KEY,  
 user_id INT,  
 instrument_id INT  
);

### Asset_Conditions

CREATE  TABLE asset_conditions (  
 condition_id INT  PRIMARY  KEY,  
 rental_id INT  
);

### Payments

CREATE  TABLE payments (  
 payment_id INT  PRIMARY  KEY,  
 amount DECIMAL  
);

### Reports

CREATE  TABLE reports (  
 id INT  PRIMARY  KEY,  
 report_type NVARCHAR(100)  
);
```
### 3. Tóm tắt cấu trúc cơ sở dữ liệu

| Tên bảng | Vai trò | Chức năng chính |
| :--- | :--- | :--- |
| **Users** | Người dùng | Quản lý tài khoản và thông tin người dùng |
| **Roles** | Phân quyền | Quản lý các quyền hạn trong hệ thống |
| **Rooms** | Tài nguyên | Quản lý thông tin các phòng tập |
| **Bookings** | Nghiệp vụ | Quản lý các lượt đặt phòng của khách |
| **Instruments** | Tài nguyên | Danh mục các loại nhạc cụ |
| **Rentals** | Nghiệp vụ | Quản lý các lượt thuê và trả nhạc cụ |
| **Conditions** | Kiểm soát | Theo dõi tình trạng tài sản trước/sau sử dụng |
| **Payments** | Tài chính | Lưu trữ thông tin thanh toán và hóa đơn |
| **Reports** | Báo cáo | Thống kê dữ liệu và báo cáo doanh thu |
----------

# PHẦN IV: THIẾT KẾ BACKEND

## 1. Kiến trúc

-   Monolithic
    
-   REST API
    
-   Node.js + Express
    

## 2. Layers

### Routes

-   auth.js
    
-   users.js
    
-   rooms.js
    
-   bookings.js
    

### Controllers

-   authController
    
-   bookingController
    

### Middleware

-   JWT auth
    

### Database

-   SQL Server / MySQL
    

----------

## 3. API chính

### Auth

-   POST `/api/auth/login`
    
-   POST `/api/auth/register`
    

### Users

-   GET `/api/users`
    
-   PUT `/api/users/:id`
    

### Rooms

-   GET `/api/rooms`
    
-   POST `/api/rooms`
    

### Bookings

-   POST `/api/bookings`
    
-   DELETE `/api/bookings/:id`
    

### Instruments

-   CRUD
    

### Borrows

-   POST `/api/borrows`
    
-   PUT `/api/borrows/:id`
    

### Reports

-   GET `/api/reports`
    

----------

## 4. Conflict Resolution

if (start_time  <  booking.end_time &&  end_time  >  booking.start_time) {  
  return  "TRÙNG";  
}

----------

# PHẦN V: FRONTEND

## 1. Công nghệ

-   HTML, CSS, JS
    
-   Bootstrap
    
-   Fetch API
    

## 2. Cấu trúc

frontend/  
├── css/  
├── js/  
├── pages/

## 3. Trang chính

-   login.html
    
-   dashboard.html
    
-   rooms.html
    
-   bookings.html
    
-   instruments.html
    

----------

# PHẦN VI: PHÂN CÔNG

## SV1 – Backend

-   API
    
-   Auth
    
-   Logic
    

## SV2 – Database Booking

-   Bookings
    
-   Schedules
    

## SV3 – Database Instruments

-   Instruments
    
-   Reports
    

----------

# PHẦN VII: CÔNG NGHỆ

### 4. Thành phần công nghệ sử dụng

| Thành phần | Công nghệ | Chi tiết sử dụng |
| :--- | :--- | :--- |
| **Backend** | Node.js | Môi trường thực thi phía máy chủ |
| **DB** | MySQL | Hệ quản trị cơ sở dữ liệu quan hệ |
| **Auth** | JWT | Cơ chế xác thực người dùng bảo mật |
| **API** | REST | Kiến trúc thiết kế API chuẩn hóa |

----------

# PHẦN VIII: YÊU CẦU

## Code

-   Clean code
    
-   Validate
    
-   Try-catch
    

## Database

-   9 bảng
    
-   FK đầy đủ
    

## API

-   CRUD
    
-   HTTP chuẩn
    

----------

# PHẦN IX: ĐÁNH GIÁ

### 5. Tiêu chí đánh giá và Tỉ trọng điểm

| Tiêu chí | Tỉ trọng (%) | Nội dung đánh giá |
| :--- | :---: | :--- |
| **Database** | 15% | Thiết kế cấu trúc bảng, quan hệ giữa các bảng |
| **API** | 25% | Xây dựng các endpoint RESTful, xử lý dữ liệu |
| **Logic** | 20% | Thuật toán xử lý nghiệp vụ, giải quyết tranh chấp lịch |
| **Code** | 15% | Chất lượng mã nguồn, sạch sẽ, dễ đọc |
| **Test** | 15% | Kiểm thử chức năng và video demo hoạt động |
| **Report** | 10% | Hình thức và nội dung file báo cáo BTL |
----------

# PHẦN X: LỘ TRÌNH

### 6. Kế hoạch thực hiện dự án (Timeline)

| Tuần | Nội dung thực hiện | Ghi chú |
| :---: | :--- | :--- |
| **1** | Thiết kế Database (DB) | Xây dựng cấu trúc 9 bảng và quan hệ |
| **2** | Users + Rooms | Phát triển API quản lý người dùng và phòng tập |
| **3** | Booking | Xây dựng logic đặt phòng và xử lý trùng lịch |
| **4** | Instruments | Phát triển tính năng quản lý và thuê nhạc cụ |
| **5** | Test | Kiểm thử toàn bộ chức năng và sửa lỗi (Bug fix) |
| **6** | Demo | Quay video hướng dẫn sử dụng và hoàn thiện báo cáo |
# KẾT LUẬN

### 1. Phân chia nhiệm vụ thành viên
Hệ thống được thiết kế theo mô hình cộng tác chặt chẽ, đảm bảo tính chuyên môn hóa cao cho từng thành viên:

| Thành viên | Vai trò chủ chốt | Nhiệm vụ chi tiết |
| :--- | :--- | :--- |
| **Nguyễn Thị Tuyết** | **Backend Lead** | Xây dựng cấu trúc Backend, thiết kế hệ thống API, xử lý Logic nghiệp vụ cốt lõi và hoàn thiện báo cáo tổng hợp. |
| **Hoàng Hiểu Đông** | **Database (Booking)** | Thiết kế và tối ưu hóa cơ sở dữ liệu phần Đặt phòng (Booking), xử lý logic ràng buộc dữ liệu thời gian. |
| **Nguyễn Việt Cường** | **Database (Assets)** | Xây dựng cấu trúc dữ liệu phần Quản lý nhạc cụ (Instruments), thiết lập hệ thống báo cáo và thống kê. |

---

### 2. Ưu điểm nổi bật của Đề tài
Dự án "Music Studio Management System" mang lại giá trị thực tiễn cao nhờ các đặc điểm sau:

* **Tính thực tế:** Giải quyết triệt để bài toán quản lý phòng tập, đặt lịch theo thời gian thực và kiểm soát vòng đời mượn/trả nhạc cụ.
* **Cấu trúc Modular:** Hệ thống được chia thành các Module độc lập (Booking, Rental, Report), giúp phát triển song song và dễ dàng mở rộng.
* **Công nghệ tiêu chuẩn:** Sử dụng Stack công nghệ hiện đại (**Node.js, Express, MySQL, RESTful API**) đảm bảo hiệu suất và tính bảo mật.
* **Phù hợp lộ trình:** Khối lượng công việc được tính toán vừa đủ cho một học kỳ, đảm bảo chất lượng từ khâu thiết kế đến thực thi.

---

### 3. Quy trình kiểm soát chất lượng (Best Practices)
Nhóm áp dụng các tiêu chuẩn kỹ thuật nghiêm ngặt trong suốt quá trình thực hiện:

| Phương pháp | Nội dung thực hiện | Lợi ích mang lại |
| :--- | :--- | :--- |
| **Git Workflow** | Quản lý mã nguồn tập trung trên GitHub ngay từ ngày đầu. | Tránh mất dữ liệu, quản lý version code và làm việc nhóm hiệu quả. |
| **Testing** | Kiểm thử API liên tục bằng Postman và kiểm tra logic trùng lịch. | Đảm bảo tính chính xác của nghiệp vụ Booking và trạng thái nhạc cụ. |
| **Periodic Demo** | Tổ chức Demo nội bộ định kỳ mỗi 2 tuần một lần. | Kiểm soát tiến độ và phát hiện sớm các lỗi phát sinh trong hệ thống. |
| **Code Review** | Các thành viên kiểm tra chéo mã nguồn của nhau. | Tăng chất lượng code, đồng bộ tư duy logic giữa các thành viên. |

----------

# TÀI LIỆU THAM KHẢO

1.  Learning SQL – O’Reilly
    
2.  Pro ASP.NET Core 7
    
3.  C# .NET Development – Packt
    
4.  C# Player’s Guide
