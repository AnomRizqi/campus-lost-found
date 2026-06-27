-- Database Schema for Campus Lost and Found
-- Designed for MySQL / MariaDB (XAMPP / Laragon)

CREATE DATABASE IF NOT EXISTS `campus_lost_found` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `campus_lost_found`;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(36) NOT NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Reports Table
CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `type` ENUM('lost', 'found') NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `image_url` VARCHAR(512) DEFAULT NULL,
  `contact_info` VARCHAR(255) NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_reports_profiles` FOREIGN KEY (`user_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seed Default Admin User (Email: admin@campus.com, Password: admin123)
INSERT INTO `profiles` (`id`, `full_name`, `email`, `role`, `password_hash`)
VALUES ('admin-uuid-0000-0000-0000-000000000000', 'Admin Campus', 'admin@campus.com', 'admin', '$2y$10$o3ZQ4H84kuQHHB2ZI.5OQ.yLpvrrBwPx/wmQybBStrWfFa82TwwSG')
ON DUPLICATE KEY UPDATE `id`=`id`;

