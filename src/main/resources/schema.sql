DROP TABLE IF EXISTS borrow_record;
DROP TABLE IF EXISTS book;
DROP TABLE IF EXISTS book_category;
DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  real_name VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) NOT NULL,
  status INT NOT NULL DEFAULT 1,
  create_time DATETIME NOT NULL,
  update_time DATETIME NOT NULL
);

CREATE TABLE book_category (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  category_name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  create_time DATETIME NOT NULL,
  update_time DATETIME NOT NULL
);

CREATE TABLE book (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  book_name VARCHAR(100) NOT NULL,
  author VARCHAR(50) NOT NULL,
  publisher VARCHAR(100) NOT NULL,
  category_id BIGINT NOT NULL,
  total_count INT NOT NULL,
  available_count INT NOT NULL,
  status INT NOT NULL DEFAULT 1,
  create_time DATETIME NOT NULL,
  update_time DATETIME NOT NULL
);

CREATE TABLE borrow_record (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  book_id BIGINT NOT NULL,
  borrow_time DATETIME NOT NULL,
  due_time DATETIME NOT NULL,
  return_time DATETIME,
  status VARCHAR(20) NOT NULL,
  create_time DATETIME NOT NULL,
  update_time DATETIME NOT NULL
);

CREATE INDEX idx_user_username ON `user`(username);
CREATE INDEX idx_book_name ON book(book_name);
CREATE INDEX idx_borrow_user_id ON borrow_record(user_id);
CREATE INDEX idx_borrow_book_id ON borrow_record(book_id);
