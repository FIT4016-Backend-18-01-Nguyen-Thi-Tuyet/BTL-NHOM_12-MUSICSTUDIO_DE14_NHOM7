CREATE DATABASE MusicStudioDB;
GO

USE MusicStudioDB;
GO

UPDATE users SET password='$2b$10$lCPnZ/tvYJKxJIxq.ObFXeLX8un48j7IVnAUTs6HA/rSUa39nqR/u' WHERE username='admin';

CREATE TABLE roles (
    id          INT           NOT NULL IDENTITY(1,1),
    name        NVARCHAR(50)  NOT NULL UNIQUE,
    description NVARCHAR(255),
    created_at  DATETIME      NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (id)
);
GO

INSERT INTO roles (name, description) VALUES
  (N'admin',    N'Quản trị viên hệ thống'),
  (N'staff',    N'Nhân viên trung tâm'),
  (N'customer', N'Khách hàng');
GO

CREATE TABLE users (
    id            INT           NOT NULL IDENTITY(1,1),
    role_id       INT           NOT NULL DEFAULT 3,
    username      NVARCHAR(100) NOT NULL UNIQUE,
    password      NVARCHAR(255) NOT NULL,
    full_name     NVARCHAR(150) NOT NULL,
    email         NVARCHAR(150) NOT NULL UNIQUE,
    phone         NVARCHAR(20),
    session_token NVARCHAR(255),
    jwt_token     NVARCHAR(MAX),
    is_active     BIT           NOT NULL DEFAULT 1,
    created_at    DATETIME      NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME      NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (id),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
GO

INSERT INTO users (role_id, username, password, full_name, email, phone) VALUES
  (1, N'admin',  N'$2b$10$PLACEHOLDER_ADMIN_HASH', N'System Admin',     N'admin@musicstudio.vn',  N'0900000001'),
  (2, N'staff1', N'$2b$10$PLACEHOLDER_STAFF_HASH', N'Nguyễn Văn Staff', N'staff1@musicstudio.vn', N'0900000002');
GO

CREATE TABLE instruments (
    id           INT            NOT NULL IDENTITY(1,1),
    name         NVARCHAR(150)  NOT NULL,
    category     NVARCHAR(100),
    brand        NVARCHAR(100),
    serial_no    NVARCHAR(100)  UNIQUE,
    description  NVARCHAR(MAX),
    rental_price DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    status       NVARCHAR(20)   NOT NULL DEFAULT N'available'
                                CONSTRAINT chk_instrument_status
                                CHECK (status IN (N'available',N'borrowed',N'maintenance',N'retired')),
    image_url    NVARCHAR(255),
    created_at   DATETIME       NOT NULL DEFAULT GETDATE(),
    updated_at   DATETIME       NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (id)
);
GO

CREATE TABLE instrument_conditions (
    id               INT           NOT NULL IDENTITY(1,1),
    instrument_id    INT           NOT NULL,
    recorded_by      INT           NOT NULL,
    condition_type   NVARCHAR(20)  NOT NULL
                                   CONSTRAINT chk_cond_type
                                   CHECK (condition_type IN (N'before_borrow',N'after_return')),
    condition_rating NVARCHAR(20)  NOT NULL
                                   CONSTRAINT chk_cond_rating
                                   CHECK (condition_rating IN (N'excellent',N'good',N'fair',N'damaged',N'broken')),
    notes            NVARCHAR(MAX),
    images           NVARCHAR(MAX),
    recorded_at      DATETIME      NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (id),
    FOREIGN KEY (instrument_id) REFERENCES instruments(id),
    FOREIGN KEY (recorded_by)   REFERENCES users(id)
);
GO

CREATE TABLE rooms (
    id           INT            NOT NULL IDENTITY(1,1),
    name         NVARCHAR(100)  NOT NULL,
    description  NVARCHAR(MAX),
    capacity     INT            NOT NULL DEFAULT 1,
    hourly_rate  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    status       NVARCHAR(20)   NOT NULL DEFAULT N'available'
                                CONSTRAINT chk_room_status
                                CHECK (status IN (N'available',N'occupied',N'maintenance')),
    image_url    NVARCHAR(255),
    created_at   DATETIME       NOT NULL DEFAULT GETDATE(),
    updated_at   DATETIME       NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (id)
);
GO

CREATE TABLE bookings (
    id           INT            NOT NULL IDENTITY(1,1),
    room_id      INT            NOT NULL,
    user_id      INT            NOT NULL,
    start_time   DATETIME       NOT NULL,
    end_time     DATETIME       NOT NULL,
    total_price  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    status       NVARCHAR(20)   NOT NULL DEFAULT N'pending'
                                CONSTRAINT chk_booking_status
                                CHECK (status IN (N'pending',N'confirmed',N'cancelled',N'completed')),
    notes        NVARCHAR(MAX),
    created_at   DATETIME       NOT NULL DEFAULT GETDATE(),
    updated_at   DATETIME       NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (id),
    FOREIGN KEY (room_id) REFERENCES rooms(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT chk_booking_time CHECK (end_time > start_time)
);
GO

CREATE INDEX idx_bookings_room_time ON bookings (room_id, start_time, end_time);
GO

CREATE TABLE borrow_transactions (
    id               INT            NOT NULL IDENTITY(1,1),
    instrument_id    INT            NOT NULL,
    user_id          INT            NOT NULL,
    staff_id         INT            NOT NULL,
    borrow_date      DATETIME       NOT NULL DEFAULT GETDATE(),
    expected_return  DATETIME       NOT NULL,
    actual_return    DATETIME,
    total_price      DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    deposit          DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    status           NVARCHAR(20)   NOT NULL DEFAULT N'borrowed'
                                    CONSTRAINT chk_borrow_status
                                    CHECK (status IN (N'borrowed',N'returned',N'overdue',N'lost')),
    pre_condition_id INT,
    notes            NVARCHAR(MAX),
    created_at       DATETIME       NOT NULL DEFAULT GETDATE(),
    updated_at       DATETIME       NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (id),
    FOREIGN KEY (instrument_id)    REFERENCES instruments(id),
    FOREIGN KEY (user_id)          REFERENCES users(id),
    FOREIGN KEY (staff_id)         REFERENCES users(id),
    FOREIGN KEY (pre_condition_id) REFERENCES instrument_conditions(id)
);
GO

CREATE TABLE return_transactions (
    id                INT            NOT NULL IDENTITY(1,1),
    borrow_id         INT            NOT NULL UNIQUE,
    staff_id          INT            NOT NULL,
    return_date       DATETIME       NOT NULL DEFAULT GETDATE(),
    post_condition_id INT,
    damage_fee        DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    late_fee          DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    refund_deposit    DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
    notes             NVARCHAR(MAX),
    created_at        DATETIME       NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (id),
    FOREIGN KEY (borrow_id)         REFERENCES borrow_transactions(id),
    FOREIGN KEY (staff_id)          REFERENCES users(id),
    FOREIGN KEY (post_condition_id) REFERENCES instrument_conditions(id)
);
GO

CREATE TABLE reports (
    id           INT            NOT NULL IDENTITY(1,1),
    report_type  NVARCHAR(100)  NOT NULL,
    title        NVARCHAR(255)  NOT NULL,
    data         NVARCHAR(MAX),
    generated_by INT            NOT NULL,
    period_from  DATE,
    period_to    DATE,
    created_at   DATETIME       NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (id),
    FOREIGN KEY (generated_by) REFERENCES users(id)
);
GO




-- VIEW 1: Lịch đặt phòng
CREATE OR ALTER VIEW view_room_schedule AS
SELECT
    b.id            AS booking_id,
    r.id            AS room_id,
    r.name          AS room_name,
    r.hourly_rate,
    u.id            AS customer_id,
    u.full_name     AS customer_name,
    u.phone         AS customer_phone,
    b.start_time,
    b.end_time,
    DATEDIFF(HOUR, b.start_time, b.end_time) AS duration_hours,
    b.total_price,
    b.status,
    b.created_at    AS booked_at
FROM bookings b
JOIN rooms r ON r.id = b.room_id
JOIN users  u ON u.id = b.user_id
WHERE b.status IN (N'pending', N'confirmed', N'completed');
GO

-- VIEW 2: Trạng thái nhạc cụ
CREATE OR ALTER VIEW view_instrument_status AS
SELECT
    i.id            AS instrument_id,
    i.name          AS instrument_name,
    i.category,
    i.brand,
    i.serial_no,
    i.rental_price,
    i.status,
    latest.user_name        AS current_borrower,
    latest.borrow_date      AS last_borrow_date,
    latest.expected_return,
    latest.actual_return,
    latest.borrow_status,
    cond.condition_rating   AS last_condition
FROM instruments i
LEFT JOIN (
    SELECT
        bt.instrument_id,
        u.full_name     AS user_name,
        bt.borrow_date,
        bt.expected_return,
        bt.actual_return,
        bt.status       AS borrow_status,
        bt.pre_condition_id,
        ROW_NUMBER() OVER (PARTITION BY bt.instrument_id ORDER BY bt.borrow_date DESC) AS rn
    FROM borrow_transactions bt
    JOIN users u ON u.id = bt.user_id
) latest ON latest.instrument_id = i.id AND latest.rn = 1
LEFT JOIN instrument_conditions cond ON cond.id = latest.pre_condition_id;
GO

-- VIEW 3: Lịch sử mượn trả
CREATE OR ALTER VIEW view_borrow_history AS
SELECT
    bt.id               AS borrow_id,
    i.name              AS instrument_name,
    i.category,
    cu.full_name        AS borrower_name,
    cu.phone            AS borrower_phone,
    su.full_name        AS staff_name,
    bt.borrow_date,
    bt.expected_return,
    rt.return_date      AS actual_return_date,
    bt.total_price      AS borrow_price,
    rt.damage_fee,
    rt.late_fee,
    rt.refund_deposit,
    (bt.total_price + ISNULL(rt.damage_fee,0) + ISNULL(rt.late_fee,0)) AS total_charged,
    pre_c.condition_rating  AS condition_before,
    post_c.condition_rating AS condition_after,
    bt.status
FROM borrow_transactions bt
JOIN instruments  i     ON i.id  = bt.instrument_id
JOIN users        cu    ON cu.id = bt.user_id
JOIN users        su    ON su.id = bt.staff_id
LEFT JOIN return_transactions   rt     ON rt.borrow_id  = bt.id
LEFT JOIN instrument_conditions pre_c  ON pre_c.id      = bt.pre_condition_id
LEFT JOIN instrument_conditions post_c ON post_c.id     = rt.post_condition_id;
GO

-- VIEW 4: Thống kê doanh thu
CREATE OR ALTER VIEW view_statistics AS
SELECT
    FORMAT(period_date, 'yyyy-MM')          AS month,
    SUM(booking_revenue)                     AS total_booking_revenue,
    SUM(borrow_revenue)                      AS total_borrow_revenue,
    SUM(damage_revenue)                      AS total_damage_revenue,
    SUM(booking_revenue + borrow_revenue + damage_revenue) AS total_revenue,
    SUM(total_bookings)                      AS total_bookings,
    SUM(total_borrows)                       AS total_borrows,
    SUM(cancelled_bookings)                  AS cancelled_bookings
FROM (
    SELECT
        CAST(start_time AS DATE)             AS period_date,
        SUM(total_price)                     AS booking_revenue,
        0                                    AS borrow_revenue,
        0                                    AS damage_revenue,
        COUNT(*)                             AS total_bookings,
        0                                    AS total_borrows,
        SUM(CASE WHEN status = N'cancelled' THEN 1 ELSE 0 END) AS cancelled_bookings
    FROM bookings
    GROUP BY CAST(start_time AS DATE)
    UNION ALL
    SELECT
        CAST(bt.borrow_date AS DATE)         AS period_date,
        0                                    AS booking_revenue,
        SUM(bt.total_price)                  AS borrow_revenue,
        SUM(ISNULL(rt.damage_fee,0) + ISNULL(rt.late_fee,0)) AS damage_revenue,
        0                                    AS total_bookings,
        COUNT(*)                             AS total_borrows,
        0                                    AS cancelled_bookings
    FROM borrow_transactions bt
    LEFT JOIN return_transactions rt ON rt.borrow_id = bt.id
    GROUP BY CAST(bt.borrow_date AS DATE)
) combined
GROUP BY FORMAT(period_date, 'yyyy-MM');
GO



-- Stored Procedure kiểm tra conflict phòng
CREATE OR ALTER PROCEDURE check_room_conflict
    @room_id    INT,
    @start_time DATETIME,
    @end_time   DATETIME,
    @exclude_id INT = 0,
    @conflict   INT OUTPUT
AS
BEGIN
    SELECT @conflict = COUNT(*)
    FROM bookings
    WHERE room_id    = @room_id
      AND status     IN (N'pending', N'confirmed')
      AND id         != ISNULL(@exclude_id, 0)
      AND start_time < @end_time
      AND end_time   > @start_time;
END;
GO

-- Indexes
CREATE INDEX idx_borrow_status      ON borrow_transactions (status);
CREATE INDEX idx_borrow_user        ON borrow_transactions (user_id);
CREATE INDEX idx_borrow_instrument  ON borrow_transactions (instrument_id);
CREATE INDEX idx_bookings_user      ON bookings (user_id);
CREATE INDEX idx_bookings_status    ON bookings (status);
CREATE INDEX idx_instruments_status ON instruments (status);
GO

SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_CATALOG = 'MusicStudioDB';

SELECT * FROM Users

SELECT * FROM roles

SELECT name 
FROM sys.tables

UPDATE users
SET password = '$2b$10$X.mDbCYvL/7Y2C6F/d4BXOAg32YRmQ.24uO4ml/oopbHQSzY4NIo6'
WHERE username = 'admin'

SELECT username, password FROM users


