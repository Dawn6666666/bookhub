-- ==============================================================================
-- BookHub 丰富测试数据插入脚本 (Standalone Insert Script)
-- 说明：本脚本仅包含 INSERT 语句，不包含 DROP/CREATE TABLE。
-- 注意事项：
-- 1. 密码均已统一使用 BCrypt 加密为 '123456'，适配 Spring Security。
-- 2. 借阅记录中的时间使用了数据库内置函数，自动相对当前时间生成。
-- ==============================================================================

-- ----------------------------
-- 1. 插入图书分类 (Book Categories)
-- ----------------------------
INSERT INTO book_category (id, category_name, description, create_time, update_time) VALUES
(1, '计算机与互联网', '编程语言、算法、软件工程、人工智能、数据库等', NOW(), NOW()),
(2, '中外文学', '中外小说、散文、诗歌、随笔、戏剧', NOW(), NOW()),
(3, '历史与文化', '世界史、中国史、人物传记、考古', NOW(), NOW()),
(4, '哲学与宗教', '西方哲学、东方哲学、逻辑学、伦理学', NOW(), NOW()),
(5, '经济与管理', '宏观经济、微观经济、企业管理、投资理财', NOW(), NOW()),
(6, '科幻与奇幻', '硬科幻、软科幻、太空歌剧、反乌托邦', NOW(), NOW()),
(7, '艺术与设计', '美术、设计理论、建筑、摄影、音乐', NOW(), NOW());

-- ----------------------------
-- 2. 插入图书信息 (Books)
-- ----------------------------
INSERT INTO book (id, book_name, author, publisher, category_id, total_count, available_count, status, create_time, update_time) VALUES
-- 计算机类
(1, 'Spring Boot 实战', '张三', '机械工业出版社', 1, 8, 8, 1, NOW(), NOW()),
(2, 'Java 核心技术 卷I', '凯瑟琳·埃克尔', '电子工业出版社', 1, 10, 10, 1, NOW(), NOW()),
(3, '深入理解计算机系统', 'Randal E. Bryant', '机械工业出版社', 1, 5, 2, 1, NOW(), NOW()),
(4, '算法导论', 'Thomas H. Cormen', '机械工业出版社', 1, 4, 0, 1, NOW(), NOW()),
(5, '设计模式：可复用面向对象软件的基础', 'GoF', '机械工业出版社', 1, 6, 6, 1, NOW(), NOW()),
(6, '高性能MySQL', 'Baron Schwartz', '电子工业出版社', 1, 7, 5, 1, NOW(), NOW()),
(7, '代码整洁之道', 'Robert C. Martin', '人民邮电出版社', 1, 12, 11, 1, NOW(), NOW()),
(8, 'Vue.js 设计与实现', '霍春阳', '人民邮电出版社', 1, 5, 5, 1, NOW(), NOW()),

-- 文学类
(9, '平凡的世界', '路遥', '人民文学出版社', 2, 4, 4, 1, NOW(), NOW()),
(10, '活着', '余华', '作家出版社', 2, 15, 12, 1, NOW(), NOW()),
(11, '百年孤独', '马尔克斯', '南海出版公司', 2, 6, 3, 1, NOW(), NOW()),
(12, '1984', '乔治·奥威尔', '北京十月文艺出版社', 2, 8, 8, 1, NOW(), NOW()),
(13, '挪威的森林', '村上春树', '上海译文出版社', 2, 5, 4, 1, NOW(), NOW()),

-- 历史类
(14, '中国通史', '吕思勉', '中华书局', 3, 3, 3, 1, NOW(), NOW()),
(15, '万历十五年', '黄仁宇', '中华书局', 3, 7, 6, 1, NOW(), NOW()),
(16, '人类简史', '尤瓦尔·赫拉利', '中信出版社', 3, 10, 8, 1, NOW(), NOW()),
(17, '明朝那些事儿', '当年明月', '中国海关出版社', 3, 20, 15, 1, NOW(), NOW()),

-- 哲学类
(18, '理想国', '柏拉图', '商务印书馆', 4, 4, 4, 1, NOW(), NOW()),
(19, '乌合之众', '古斯塔夫·勒庞', '中央编译出版社', 4, 6, 6, 1, NOW(), NOW()),

-- 经济管理类
(20, '思考，快与慢', '丹尼尔·卡尼曼', '中信出版社', 5, 8, 7, 1, NOW(), NOW()),
(21, '富爸爸，穷爸爸', '罗伯特·清崎', '四川轻初出版社', 5, 12, 10, 1, NOW(), NOW()),

-- 科幻类
(22, '三体（全集）', '刘慈欣', '重庆出版社', 6, 20, 5, 1, NOW(), NOW()),
(23, '沙丘', '弗兰克·赫伯特', '江苏凤凰文艺出版社', 6, 10, 10, 1, NOW(), NOW()),

-- 艺术设计类
(24, '写给大家看的设计书', '罗宾·威廉姆斯', '人民邮电出版社', 7, 5, 5, 1, NOW(), NOW());

-- ----------------------------
-- 3. 插入用户数据 (Users)
-- ----------------------------
-- 默认密码：123456 的 BCrypt 哈希值为: $2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6
INSERT INTO `user` (id, username, password, real_name, phone, role, status, create_time, update_time) VALUES
(1, 'admin', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', '系统管理员', '13800000000', 'admin', 1, NOW(), NOW()),
(2, 'student', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', '张同学', '13900000000', 'user', 1, NOW(), NOW()),
(3, 'li_hua', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', '李华', '13700001111', 'user', 1, NOW(), NOW()),
(4, 'wang_ming', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', '王明', '13600002222', 'user', 1, NOW(), NOW()),
(5, 'zhao_qiang', '$2a$10$slYQmyNdGzTn7ZLBXBChFOC9f6kFjAqPhccnP6DxlWXx2lPk1C3G6', '赵强', '13500003333', 'user', 1, NOW(), NOW());

-- ----------------------------
-- 4. 插入借阅记录 (Borrow Records)
-- 说明：这里的数据与上面书籍的可用库存(available_count)是对应的。
-- ----------------------------
INSERT INTO borrow_record (id, user_id, book_id, borrow_time, due_time, return_time, status, create_time, update_time) VALUES
-- 正常借阅中 (未归还)
(1, 2, 3, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 25 DAY), NULL, '未归还', NOW(), NOW()),
(2, 3, 3, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 28 DAY), NULL, '未归还', NOW(), NOW()),
(3, 3, 6, DATE_SUB(NOW(), INTERVAL 15 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY), NULL, '未归还', NOW(), NOW()),
(4, 5, 22, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), NULL, '未归还', NOW(), NOW()),

-- 已经逾期 (未归还且超出due_time)
(5, 4, 4, DATE_SUB(NOW(), INTERVAL 40 DAY), DATE_SUB(NOW(), INTERVAL 10 DAY), NULL, '逾期', NOW(), NOW()),
(6, 4, 11, DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY), NULL, '逾期', NOW(), NOW()),

-- 历史记录 (已归还)
(7, 2, 10, DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), '已归还', NOW(), NOW()),
(8, 5, 1, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), '已归还', NOW(), NOW());