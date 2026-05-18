# 《期末大作业》 项目报告书

题 目： <u>基于 Spring Boot 的现代图书管理系统 (BookHub)</u>

专 业： <u>计算机科学与技术（请自行修改）</u>

学 号： <u>2026xxxxxx（请自行修改）</u>

学生姓名： <u>（请自行修改）</u>

指导教师： <u>王东</u>

完成日期： <u>2026年05月22号</u>

---

## 摘要

随着数字化信息管理的发展，传统的图书管理方式严重依赖人工登记，不仅效率低下，且容易出现库存不准确、借阅记录混乱等问题。同时，传统的后台管理系统往往界面冰冷生硬，缺乏人文关怀。

本项目旨在开发一套基于 Spring Boot 和 Vue 3 的轻量级、现代化的图书管理系统（BookHub）。项目不仅仅满足基本的图书增删改查与自助借阅归还功能，更在前端深度引入了“克制的艺术 - 数字人文主义”设计哲学。通过羊皮纸白背景、学术衬线字体以及温润的交互色彩，系统在提供高效数据处理能力的同时，致力于为用户提供严谨、可靠且护眼的操作体验。系统采用前后端接口分离架构，并内置了一键自动化的数据库初始化机制，极大降低了部署与演示的成本。

**关键词：** Java；Spring Boot；图书管理系统；Vue 3；MyBatis-Plus

---

## 目 录
1. [第1章 需求分析](#第1章-需求分析)
   1.1 [功能性需求](#11-功能性需求)
   1.2 [非功能性需求](#12-非功能性需求)
2. [第2章 系统设计](#第2章-系统设计)
   2.1 [总体框架设计](#21-总体框架设计)
   2.2 [系统数据库设计](#22-系统数据库设计)
3. [第3章 系统实现](#第3章-系统实现)
   3.1 [前端页面实现](#31-前端页面)
   3.2 [后端功能实现](#32-后端功能)
4. [第4章 系统测试](#第4章-系统测试)
5. [第5章 结束语](#第5章-结束语)
6. [附录: 主要源程序](#附录-主要源程序)

---

## 第1章 需求分析

### 1.1 功能性需求
本系统主要服务于学校图书馆或小型图书室，系统功能依据角色划分为三大模块：
1. **公共基础模块**：提供用户登录、安全退出、Token鉴权、个人资料查看与修改、密码重置功能。
2. **管理员功能模块**：
   - 查看全馆大盘数据（图书总数、用户总数、借阅流水）。
   - 用户账号的CRUD管理及状态启停。
   - 图书分类的维护，以及单本图书的上下架、库存等元信息管理。
   - 具备全局视角的借阅记录审计，追踪逾期情况。
3. **普通用户功能模块**：
   - 浏览馆藏概览与私有借阅统计。
   - 带有分类与关键字组合筛选的图书查询大厅，实时展现可用库存。
   - 一键式在线借阅与自助归还操作。
   - 查看个人专属借阅历史，系统需对逾期记录进行高亮预警提醒。

### 1.2 非功能性需求
1. **交互与视觉体验**：摒弃传统框架的生硬感，UI 界面需遵循统一的设计 Token（如 `Inter` 无衬线体搭配 `Source Serif` 衬线体标题），体现现代化与学术感。
2. **易用性与部署便利性**：要求系统开箱即用。开发与演示阶段，系统需具备在每次启动时自动构建表结构，并智能灌入大量真实且具备多状态（未还、已还、逾期）的 Mock 数据的能力。
3. **数据一致性与安全性**：用户密码不可明文存储，必须经过 BCrypt 哈希加密；借阅过程需保证库存扣减逻辑的事务原子性，防止超卖。

---

## 第2章 系统设计

### 2.1 总体框架设计
BookHub 采用了轻量级的变体前后端分离架构（B/S模式）：
- **后端**：以 Spring Boot 3.3.5 为核心框架，使用 Spring Web 提供 RESTful API 接口，通过 MyBatis-Plus 实现对象关系映射与数据库的高效交互。统一封装了 `ApiResponse` 和 `PageResponse` 以规范接口数据契约。
- **前端**：无需额外部署 Node/Vite 服务器，静态资源（HTML/CSS/JS）交由 Spring Boot 直接托管。前端逻辑完全使用 Vue 3 (Composition API 思想) 与 Element Plus 构建，通过 Axios 进行异步网络请求，并配置了请求/响应全局拦截器实现无感知的 Token 鉴权。

### 2.2 系统数据库设计
数据库核心实体表关系设计如下，并为高频查询字段建立了索引：
1. `user`（用户表）：存储账号、BCrypt加密密码、真实姓名、角色及启停状态。
2. `book_category`（图书分类表）：存储分类名称及描述。
3. `book`（图书信息表）：包含书名、作者、出版社，关联 `category_id`，并拆分了 `total_count` (总库存) 与 `available_count` (可借库存) 以控制并发流转。
4. `borrow_record`（借阅记录表）：记录 `user_id` 与 `book_id` 的关联，包含借出时间、应还时间、实际归还时间及状态机字典（未归还/逾期/已归还）。

---

## 第3章 系统实现

### 3.1 前端页面
前端实现抛弃了繁杂的脚手架，极简回归到纯粹的 Web 结构。
- **CSS 变量化驱动**：在 `styles.css` 中建立了完整的 Design System Token，如羊皮纸色背景、陶土橘主色等。
- **高密度信息卡片**：在 `app.js` 中利用 Vue 3 特性，将后端返回的图书与借阅数据（如 `BookVO`）组合映射。例如借阅表格中，利用 JavaScript Date 函数配合后端生成的相对时间，对逾期借阅记录实时打上 `danger` 标签。
- **动态角色视图**：应用层面根据登录用户的 Role 属性，动态计算出对应的左侧菜单栏及 Dashboard 统计卡片内容，实现一套代码，两种视角。

### 3.2 后端功能
后端采用标准的三层架构（Controller -> Service -> Mapper）。
- **鉴权机制**：放弃了沉重的 Spring Security Filter Chain，采用轻量级的 Web 拦截器 (`AuthInterceptor`) 校验请求头中的 JWT Token。
- **开箱即用初始化**：通过 `application.properties` 配置 `spring.sql.init.mode=always` 结合 `schema.sql` 和 `data.sql`。同时，为解决不同版本 BCrypt 哈希兼容性导致的密码错误问题，通过实现 `CommandLineRunner` 接口的 `DataInitializer` 类，在系统启动尾声强制使用当前环境的 Encoder 对测试账号进行二次加密覆盖，保障了 100% 成功登录的体验。

---

## 第4章 系统测试

测试重点围绕系统的角色越权、边界条件以及数据展现：
1. **权限越权测试**：使用普通学生账号强制请求 `/user/list` 接口，系统成功返回 JSON 报错信息，前端拦截器捕获并弹出 `ElMessage` 提示“只有管理员可以访问该功能”。
2. **库存边界测试**：当某本图书的 `available_count` 为 0 时，前端“借阅”按钮消失，变为“无库存”不可点击状态。
3. **数据初始化测试**：每次重启项目，数据库表被清空并重新灌入 24 本图书和 8 条借阅记录。使用默认账号 `student`/`123456` 能够顺利登录，并在 Dashboard 看到专属于个人的借阅流水，逾期条目正确标红，测试通过。

---

## 第5章 结束语

BookHub 项目的开发，不仅让我深入理解了 Java 企业级开发的规范流程（从 Controller 接口设计到数据库实体映射），更让我体会到了前后端协同工作时“契约”与“容错”的重要性。

在开发初期，由于对密码加密和数据库初始化加载时机的理解不够深刻，曾遇到了测试账号死活无法登录的“玄学”问题。通过阅读源码和日志分析，我最终通过结合 `data.sql` 与 `CommandLineRunner` 进行密码动态覆写的方法，彻底解决并沉淀了宝贵的经验。

此外，本次大作业最大的一次突破在于前端设计哲学的重塑。打破了以往套用现成生硬模板的习惯，尝试以“数字人文主义”和“克制的艺术”为理念，亲自用 CSS Variables 重构了一整套具有学术气息的样式。这让我意识到，卓越的软件工程不仅仅在于底层架构的健壮，更在于与用户第一交互界面所传递出的专业温度。未来，我将继续完善系统的借阅超期自动计费机制与图表大屏展示功能。

---

## 附录: 主要源程序

### 1. 后端 - 数据自动修复与初始化核心逻辑 (DataInitializer.java)
```java
@Component
public class DataInitializer implements CommandLineRunner {
    // ... 省略注入逻辑 ...

    @Override
    public void run(String... args) {
        // 由于项目配置了每次启动执行 data.sql 自动灌入测试数据
        // 为防止由于跨环境引起的 BCrypt Hash 不兼容问题导致无法登录
        // 在启动最后阶段，使用当前运行环境的 PasswordEncoder 对所有初始用户密码进行强一致性覆盖
        if (userMapper.selectCount(null) > 0) {
            String encoded123456 = passwordEncoder.encode("123456");
            for (User user : userMapper.selectList(null)) {
                user.setPassword(encoded123456);
                userMapper.updateById(user);
            }
        }
    }
}
```

### 2. 后端 - 借阅控制逻辑片段 (BorrowServiceImpl.java)
```java
@Override
@Transactional(rollbackFor = Exception.class)
public void borrow(Long userId, Long bookId) {
    Book book = bookMapper.selectById(bookId);
    if (book.getAvailableCount() <= 0) {
        throw new BizException("该书已被借空");
    }
    // 扣减库存
    book.setAvailableCount(book.getAvailableCount() - 1);
    bookMapper.updateById(book);

    // 生成借阅记录，默认借期 30 天
    BorrowRecord record = new BorrowRecord();
    record.setUserId(userId);
    record.setBookId(bookId);
    record.setBorrowTime(LocalDateTime.now());
    record.setDueTime(LocalDateTime.now().plusDays(30));
    record.setStatus("未归还");
    borrowRecordMapper.insert(record);
}
```

### 3. 前端 - Axios 全局拦截器 (app.js)
```javascript
const http = axios.create({
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
});

http.interceptors.request.use(config => {
    const token = localStorage.getItem('bookhub_token');
    if (token) config.headers['X-Auth-Token'] = token;
    return config;
});

http.interceptors.response.use(
    res => {
        if (res.data && res.data.code === 0) return res.data.data;
        const msg = (res.data && res.data.message) || '请求失败';
        ElMessage.error(msg);
        return Promise.reject(new Error(msg));
    },
    err => {
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('bookhub_token');
            window.location.reload();
        }
        ElMessage.error(err.message || '网络错误');
        return Promise.reject(err);
    }
);
```

### 4. 前端 - 数字人文设计系统基础变量 (styles.css)
```css
:root {
    /* =========================================
       Claude Design Philosophy Tokens
       ========================================= */
    --color-primary: #D97757;      /* Terracotta 陶土橘 */
    --color-bg: #FAF9F6;           /* Paper White 羊皮纸白 */
    --color-surface: #FFFFFF;      /* Pure White 纯白 */
    --color-text: #1C1C16;         /* Deep Charcoal 深炭黑 */
    --color-border: #E6E4DC;       /* 边框色 */
    
    --sidebar-bg: #191918;         /* Warm Dark 深褐灰 */
    --sidebar-text: #ECEBE6;

    /* 字体栈：引入衬线体增强学术感与权威感 */
    --font-serif: "Source Serif 4", "Noto Serif SC", "Georgia", "SimSun", serif;
    --font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```