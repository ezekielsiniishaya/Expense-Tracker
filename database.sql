CREATE DATABASE IF NOT EXISTS `expense_tracker`;

USE expense_tracker;

DROP TABLE IF EXISTS `expenses`;

CREATE TABLE IF NOT EXISTS `users` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  date DATE,
  amount DECIMAL(10, 2),
  description VARCHAR(50),
  category ENUM('Food', 'Transportation', 'Tax', 'Housing', 'Personal care', 'Entertainment', 'Education','Debt', 'Miscellaneous'),
  paymentMethod ENUM('Credit Card', 'Debit Card', 'Cash', 'Bank Transfer'), 
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
