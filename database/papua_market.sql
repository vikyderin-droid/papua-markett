-- =============================================================================
-- PAPUA MARKET — Skema Database Relasional MySQL (XAMPP / MariaDB Compatible)
-- Tagline: "Dari Papua untuk Indonesia"
-- =============================================================================

CREATE DATABASE IF NOT EXISTS papua_market CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE papua_market;

-- 1. Tabel users (pembeli, penjual, admin)
CREATE TABLE users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(30) DEFAULT '',
  role ENUM('buyer', 'seller', 'admin') NOT NULL DEFAULT 'buyer',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabel sellers (profil toko UMKM Papua)
CREATE TABLE sellers (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE,
  store_name VARCHAR(150) NOT NULL,
  origin_city VARCHAR(100) NOT NULL,
  description TEXT,
  package_tier ENUM('reguler', 'premium') NOT NULL DEFAULT 'reguler',
  is_verified TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sellers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Tabel categories (kategori produk lokal Papua)
CREATE TABLE categories (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(255) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabel products
CREATE TABLE products (
  id VARCHAR(64) PRIMARY KEY,
  seller_id VARCHAR(64) NOT NULL,
  category_id VARCHAR(64) NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price INT UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  origin_location VARCHAR(120) NOT NULL,
  weight_gram INT UNSIGNED NOT NULL DEFAULT 500,
  image_url VARCHAR(500) NOT NULL,
  sold_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  is_promoted TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_products_category (category_id),
  INDEX idx_products_featured (is_featured, is_active)
) ENGINE=InnoDB;

-- 5. Tabel carts
CREATE TABLE carts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NULL,
  session_key VARCHAR(120) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Tabel cart_items
CREATE TABLE cart_items (
  id VARCHAR(64) PRIMARY KEY,
  cart_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cart_product (cart_id, product_id)
) ENGINE=InnoDB;

-- 7. Tabel addresses (alamat pengiriman pembeli)
CREATE TABLE addresses (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  recipient_name VARCHAR(120) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  street_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  province VARCHAR(100) NOT NULL,
  postal_code VARCHAR(15) NOT NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Tabel orders
CREATE TABLE orders (
  id VARCHAR(64) PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  buyer_id VARCHAR(64) NULL,
  buyer_name VARCHAR(120) NOT NULL,
  buyer_email VARCHAR(160) NOT NULL,
  buyer_phone VARCHAR(30) NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_province VARCHAR(100) NOT NULL,
  shipping_postal_code VARCHAR(15) NOT NULL,
  shipping_method VARCHAR(80) NOT NULL,
  shipping_cost INT UNSIGNED NOT NULL DEFAULT 0,
  subtotal INT UNSIGNED NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount INT UNSIGNED NOT NULL,
  total_amount INT UNSIGNED NOT NULL,
  status ENUM('menunggu', 'diproses', 'dikirim', 'selesai', 'dibatalkan') NOT NULL DEFAULT 'menunggu',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 9. Tabel order_items
CREATE TABLE order_items (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NULL,
  seller_id VARCHAR(64) NOT NULL,
  product_name VARCHAR(180) NOT NULL,
  unit_price INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  subtotal INT UNSIGNED NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  CONSTRAINT fk_order_items_seller FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 10. Tabel payments
CREATE TABLE payments (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL UNIQUE,
  method ENUM('transfer_bank', 'qris', 'cod') NOT NULL,
  amount INT UNSIGNED NOT NULL,
  status ENUM('simulasi_menunggu', 'simulasi_terkonfirmasi', 'cod_bayar_ditempat') NOT NULL DEFAULT 'simulasi_menunggu',
  reference_code VARCHAR(80) NOT NULL,
  is_simulated TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Tabel reviews
CREATE TABLE reviews (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  reviewer_name VARCHAR(120) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Tabel notifications
CREATE TABLE notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 13. Tabel favorites & platform_settings
CREATE TABLE favorites (
  user_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE platform_settings (
  setting_key VARCHAR(64) PRIMARY KEY,
  setting_value VARCHAR(255) NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO platform_settings (setting_key, setting_value) VALUES ('commission_rate', '5');
