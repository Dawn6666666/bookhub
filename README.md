# BookHub 图书管理系统

BookHub 是一个面向期末大作业的现代化轻量级图书管理系统。采用 `Spring Boot + MyBatis-Plus + MySQL` 实现后端，前端使用 `Vue 3 + Element Plus + Axios` 构建单页应用界面，开箱即用，非常适合课堂演示、毕业设计和作业提交。

## 项目定位与设计哲学

本项目在保证“开箱即用”与“结构清晰”的基础上，对前端界面进行了深度重构，引入了“克制的艺术 - 数字人文主义”设计哲学：

- 视觉隐喻：采用羊皮纸白背景与深褐灰色侧边栏，减少长时间操作的视觉疲劳。
- 学术与权威：全局标题与核心数据采用衬线体排版，彰显图书馆系统的严谨感。
- 温润的交互：以陶土橘作为系统核心交互色，辅以极轻量的阴影与线条。
- 高密度信息：列表展示采用复合信息列结构，直观呈现书籍可用库存比例及智能状态打标。

## 技术栈

- 后端：JDK 17, Spring Boot 3.3.5, MyBatis-Plus 3.5.7, MySQL 8
- 安全：Spring Validation, Spring Security Crypto (BCrypt)
- 前端：Vue 3, Element Plus, @element-plus/icons-vue, Axios
- 字体：Source Serif 4, Noto Serif SC, Inter

## 功能说明

### 公共功能
- 用户登录、安全退出与 Token 拦截校验
- 基于角色的首页 Dashboard 动态渲染
- 个人资料查看与修改、密码重置

### 管理员功能
- 首页概览：查看全馆图书总数、注册用户总数、全馆借阅流水统计
- 用户管理：账户新增、编辑、删除与状态启停
- 图书与分类管理：无限级图书上下架，书籍元信息维护
- 借阅审计：查看所有用户的借阅行为及逾期状态

### 普通用户功能
- 首页概览：查看馆藏概览与个人私有借阅统计
- 图书查询：多条件组合筛选，实时查看馆藏可用库存情况
- 自助借还：在线借阅与一键归还操作
- 我的借阅：借阅历史时间轴展示，逾期高亮提醒

### 业务规则
- 借阅时自动扣减可借库存，归还时自动恢复
- 库存不足时禁止借阅
- 同一本图书存在未归还记录时，禁止重复借阅
- 借阅记录自动写入借阅时间、应还时间与归还时间

## 项目结构

```text
src/main/java/org/example/bookhub
├── common         统一返回体 (ApiResponse, PageResponse)
├── config         配置类 (Mybatis, 跨域, 拦截器注册)
├── controller     RESTful 接口层
├── domain         数据实体类
├── dto            VO/DTO 数据传输对象
├── exception      自定义异常与全局拦截处理
├── mapper         MyBatis-Plus Mapper
├── security       JWT 结构与密码加密
├── service        业务逻辑接口与实现
└── web            请求拦截器鉴权
```

前端静态资源由 Spring Boot 直接托管（无须单独启动 Node/Vite 服务）：

```text
src/main/resources/static
├── index.html     入口文件（引入 CDN 资源与学术字体）
├── styles.css     设计系统 CSS Variables 及样式规范
└── app.js         Vue 3 核心逻辑（视图路由、Axios 封装、组件渲染）
```

## 数据库与自动初始化

本项目配置了便捷的开箱即用机制，位于 `application.properties` 中：

```properties
spring.sql.init.mode=always
spring.sql.init.schema-locations=classpath:schema.sql
spring.sql.init.data-locations=classpath:data.sql
```

每次启动项目时，系统会自动执行：
1. schema.sql：重建所有表结构，确保开发环境纯净。
2. data.sql：自动插入极其丰富且真实的测试数据，包含 7 大分类、24本经典名著、5个测试用户以及覆盖了多状态（未还、已还、逾期）的借阅流水。

注意：如果您希望数据能够持久化保存，不被重启清空，请将 `mode=always` 改为 `never`。

## 默认测试账号

系统预置了多个账号，密码统一采用 BCrypt 加密处理。

- 管理员：admin / 123456
- 普通用户（有正常借阅）：student / 123456
- 普通用户（有逾期记录）：wang_ming / 123456

## 本地启动指南

### 1. 准备数据库

在本地 MySQL 创建一个名为 `bookhub` 的空数据库。

### 2. 修改数据库配置

编辑 `src/main/resources/application.properties`，填入您的数据库账号密码：

```properties
spring.datasource.username=root
spring.datasource.password=您的密码
```

### 3. 启动应用

直接运行 `BookhubApplication.java`。启动完成后，打开浏览器访问：

```text
http://localhost:8080/
```

## 答辩演示建议路径

1. 管理员视角：使用 admin 登录，展示深色的学术风格 UI 和包含全馆统计的 Dashboard。
2. 切换普通用户视角：退出登录，使用 student 登录，展示 Dashboard 的内容动态切换为个人私有视图。
3. 借阅闭环展示：在图书列表中借阅一本书，观察可用库存减少，前往“我的借阅”展示状态变更为“未归还”。
4. 逾期预警展示：退出并登录 wang_ming 账号，前往“我的借阅”，展示系统中高亮的“逾期”提醒标签。
