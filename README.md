# BookHub 图书管理系统

BookHub 是一个面向期末大作业的轻量图书管理系统，采用 `Spring Boot + MyBatis-Plus + MySQL` 实现后端，前端使用 `Vue 3 + Element Plus` 构建单页界面，开箱即用，适合课堂演示和作业提交。

## 项目定位

这个项目没有追求复杂的企业级设计，而是优先保证：

- 能稳定运行
- 功能完整可演示
- 结构清晰、便于答辩讲解
- 部署成本低

核心实现覆盖了登录、角色区分、用户管理、图书分类、图书管理、借阅归还、借阅记录查询和个人信息维护。

## 技术栈

- JDK 17
- Spring Boot 3.3.5
- MyBatis-Plus 3.5.7
- MySQL 8
- Spring Validation
- Spring Security Crypto
- Vue 3
- Element Plus
- CDN 静态资源引入

## 功能说明

### 公共功能

- 用户登录、退出
- 登录态校验
- 个人信息查看与修改
- 修改密码

### 管理员功能

- 用户管理
- 图书分类管理
- 图书管理
- 全部借阅记录查询

### 普通用户功能

- 图书查询
- 借阅图书
- 归还图书
- 查看自己的借阅记录

### 业务规则

- 借阅时自动扣减可借库存
- 归还时自动恢复库存
- 库存不足时禁止借阅
- 同一本图书存在未归还记录时，禁止重复借阅
- 借阅记录会写入借阅时间、应还时间、归还时间和状态

## 项目结构

```text
src/main/java/org/example/bookhub
├── common         统一返回体
├── config         配置类
├── controller     接口层
├── domain         数据实体
├── dto            请求参数对象
├── exception      异常定义
├── handler        全局异常处理
├── mapper         MyBatis-Plus Mapper
├── security       登录与权限相关
├── service        业务接口
└── web            Web 拦截器
```

前端静态资源位于：

```text
src/main/resources/static
├── index.html
├── styles.css
└── app.js
```

前端没有单独创建 Vite 工程，而是通过 CDN 引入 Vue 3 和 Element Plus，然后由 Spring Boot 直接托管静态页面。这样代码比原生 JavaScript 更清晰，同时启动方式仍然保持简单。

## 数据库初始化

启动项目时会自动执行 `src/main/resources/schema.sql`，创建并初始化以下表：

- `user`
- `book_category`
- `book`
- `borrow_record`

同时会写入少量测试数据，方便直接登录演示。

## 默认账号

- 管理员：`admin / admin123`
- 普通用户：`student / 123456`

## 本地启动

### 1. 准备数据库

先创建一个名为 `bookhub` 的 MySQL 数据库。

### 2. 修改数据库配置

编辑 `src/main/resources/application.properties`，把下面配置改成你自己的数据库账号密码：

```properties
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:}
```

也可以直接把它们改成自己的本地 MySQL 账号密码，例如：

```properties
spring.datasource.username=root
spring.datasource.password=你的密码
```

### 3. 启动应用

直接运行 `BookhubApplication.java`，或者使用 Maven：

```bash
mvn spring-boot:run
```

启动后访问：

```text
http://localhost:8080/
```

## 常见问题

### 1. 页面空白

- 先确认后端已启动
- 再确认浏览器访问的是 `http://localhost:8080/`
- 检查浏览器是否能访问 CDN 资源
- 打开开发者工具看看控制台是否有报错

### 2. 数据库连接失败

- 检查 MySQL 是否启动
- 检查库名是否为 `bookhub`
- 检查用户名和密码是否正确
- 检查端口是否为 `3306`

### 3. 启动时报表结构错误

- 直接删除旧库后重新创建
- 或者让程序重新初始化表结构
- 确保没有手工改坏表名或字段名

### 4. 借阅点击后出现重复记录

- 这通常是前端重复绑定事件导致的
- 当前版本已处理为单一点击委托
- 如果你本地改过 `app.js`，建议重新刷新浏览器缓存

## 演示建议

答辩时可以按这个顺序演示：

1. 管理员登录
2. 查看用户管理
3. 查看图书分类和图书列表
4. 普通用户登录
5. 借阅一本图书
6. 查看借阅记录
7. 归还图书
8. 查看库存变化

## 备注

这个项目定位是期末作业，不追求过度复杂的架构拆分，重点是把基本流程跑通、界面能演示、数据能落库、逻辑能自洽。
