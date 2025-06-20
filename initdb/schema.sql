-- initdb/schema.sql
CREATE TABLE users (
    user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    google_id VARCHAR(255) DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) DEFAULT NULL,
    role VARCHAR(50) NOT NULL,
    mobile VARCHAR(15) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

CREATE TABLE Categories (
    category_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    PRIMARY KEY (category_id)
);

CREATE TABLE coupons (
    id INT NOT NULL AUTO_INCREMENT,
    coupon_name VARCHAR(255) NOT NULL,
    coupon_value DECIMAL(10,2) NOT NULL,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME DEFAULT NULL,
    used TINYINT(1) DEFAULT 0,
    user_id INT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE course_videos (
    id INT NOT NULL AUTO_INCREMENT,
    course_id INT NOT NULL,
    video_url VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY (course_id)
);

CREATE TABLE Courses (
    course_id INT NOT NULL AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    category_id INT DEFAULT NULL,
    video_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    price DECIMAL(10,2) DEFAULT NULL,
    sub_category VARCHAR(255) DEFAULT NULL,
    thumbnail VARCHAR(255) DEFAULT NULL,
    is_live TINYINT(1) NOT NULL DEFAULT 0,
    user_id INT NOT NULL,
    PRIMARY KEY (course_id)
);

CREATE TABLE payments (
    payment_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id INT DEFAULT NULL,
    course_id INT DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_status VARCHAR(50) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(200) NOT NULL,  
    coupon_code VARCHAR(50) DEFAULT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    PRIMARY KEY (payment_id)
);

CREATE TABLE purchases (
    id INT NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    video_id VARCHAR(255) NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE ProjectSubmissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    submission_link VARCHAR(255) NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    course_id INT UNSIGNED NOT NULL,
    status ENUM('Under Review', 'Approved', 'Rejected') DEFAULT 'Under Review'
);

CREATE TABLE user_otps (
  mobile VARCHAR(15) NOT NULL PRIMARY KEY,
  otp VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);


CREATE TABLE CourseReviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    user_id INT NOT NULL,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES Courses(course_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);