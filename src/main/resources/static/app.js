(function () {
    const { createApp } = Vue;
    const { ElMessage, ElMessageBox } = ElementPlus;

    // Axios configuration with interceptors for authentication and error handling
    const http = axios.create({
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
    });

    http.interceptors.request.use(config => {
        const token = localStorage.getItem('bookhub_token');
        if (token) {
            config.headers['X-Auth-Token'] = token;
        }
        return config;
    });

    http.interceptors.response.use(
        response => {
            const res = response.data;
            if (res && res.code === 0) {
                return res.data;
            }
            const msg = (res && res.message) || '请求失败';
            ElMessage.error(msg);
            return Promise.reject(new Error(msg));
        },
        error => {
            if (error.response && error.response.status === 401) {
                localStorage.removeItem('bookhub_token');
                window.location.reload();
            }
            const msg = (error.response && error.response.data && error.response.data.message) || error.message || '网络请求错误';
            ElMessage.error(msg);
            return Promise.reject(error);
        }
    );

    // Initial empty states for forms
    const emptyUserForm = () => ({ id: null, username: '', password: '', realName: '', phone: '', role: 'user', status: 1 });
    const emptyCategoryForm = () => ({ id: null, categoryName: '', description: '' });
    const emptyBookForm = () => ({ id: null, bookName: '', author: '', publisher: '', categoryId: null, totalCount: 1, availableCount: 1, status: 1 });

    const app = createApp({
        data() {
            return {
                token: localStorage.getItem('bookhub_token') || '',
                user: null, // Stores { id, username, realName, role, phone, status }
                activeView: 'dashboard',
                loading: false,
                tableLoading: false,
                submitting: false,
                borrowingId: null,
                returningId: null,
                loginForm: { username: 'student', password: '123456' },
                userQuery: { page: 1, size: 10, username: '', realName: '', status: '' },
                categoryQuery: { page: 1, size: 10, keyword: '' },
                bookQuery: { page: 1, size: 10, bookName: '', author: '', categoryId: '', status: '' },
                borrowQuery: { page: 1, size: 10, userName: '', bookName: '', status: '' },
                users: [],
                usersTotal: 0,
                categories: [], // Also used for select options
                categoriesTotal: 0,
                books: [],
                booksTotal: 0,
                borrows: [],
                borrowsTotal: 0,
                userDialogVisible: false,
                categoryDialogVisible: false,
                bookDialogVisible: false,
                userDialogTitle: '',
                categoryDialogTitle: '',
                bookDialogTitle: '',
                userForm: emptyUserForm(),
                categoryForm: emptyCategoryForm(),
                bookForm: emptyBookForm(),
                profileForm: { id: null, username: '', realName: '', phone: '', role: '' },
                passwordForm: { oldPassword: '', newPassword: '' }
            };
        },
        computed: {
            isAdmin() {
                return this.user && this.user.role === 'admin';
            },
            menus() {
                const base = [{ key: 'dashboard', label: '首页', icon: 'House' }];
                if (this.isAdmin) {
                    return [
                        ...base,
                        { key: 'users', label: '用户管理', icon: 'User' },
                        { key: 'categories', label: '图书分类', icon: 'Collection' },
                        { key: 'books', label: '图书管理', icon: 'Notebook' },
                        { key: 'borrows', label: '借阅记录', icon: 'Files' }
                    ];
                }
                return [
                    ...base,
                    { key: 'books', label: '图书查询', icon: 'Search' },
                    { key: 'borrows', label: '我的借阅', icon: 'Tickets' },
                    { key: 'profile', label: '个人信息', icon: 'Setting' }
                ];
            },
            currentTitle() {
                const item = this.menus.find(m => m.key === this.activeView);
                return item ? item.label : '首页';
            },
            dashboardCards() {
                if (this.isAdmin) {
                    return [
                        { label: '图书总数', value: this.booksTotal || 0, icon: 'Notebook' },
                        { label: '用户总数', value: this.usersTotal || 0, icon: 'User' },
                        { label: '全馆借阅', value: this.borrowsTotal || 0, icon: 'Collection' }
                    ];
                }
                return [
                    { label: '馆藏图书', value: this.booksTotal || 0, icon: 'Notebook' },
                    { label: '我的借阅', value: this.borrowsTotal || 0, icon: 'Tickets' }
                ];
            }
        },
        mounted() {
            this.bootstrap();
        },
        methods: {
            // Formatting and label helpers
            formatTime(val) {
                return val ? val.replace('T', ' ').slice(0, 16) : '-';
            },
            roleText(role) {
                return role === 'admin' ? '管理员' : '普通用户';
            },
            statusText(status) {
                return status === 1 ? '正常' : '禁用';
            },
            bookStatusText(status) {
                return status === 1 ? '正常' : '下架';
            },
            getBorrowStatusTag(status) {
                if (status === '已归还') return 'success';
                if (status === '逾期') return 'danger';
                return 'warning';
            },
            getStockTag(available, total) {
                if (available === 0) return 'danger';
                if (available < total * 0.2) return 'warning';
                return 'success';
            },

            // Initialization and Auth
            async bootstrap() {
                if (this.token) {
                    try {
                        const data = await http.get('/me');
                        this.user = { id: data.id, username: data.username, realName: data.realName, role: data.role };
                        this.activeView = this.isAdmin ? 'dashboard' : 'books';
                        await this.loadCurrentViewData();
                    } catch (err) {
                        this.token = '';
                        localStorage.removeItem('bookhub_token');
                    }
                }
            },
            async login() {
                this.loading = true;
                try {
                    const data = await http.post('/login', this.loginForm);
                    this.token = data.token;
                    localStorage.setItem('bookhub_token', data.token);
                    this.user = { id: data.userId, username: data.username, realName: data.realName, role: data.role };
                    this.activeView = this.isAdmin ? 'dashboard' : 'books';
                    ElMessage.success('登录成功，欢迎回来 ' + data.realName);
                    await this.loadCurrentViewData();
                } catch (err) {
                    // Handled by interceptor
                } finally {
                    this.loading = false;
                }
            },
            logout() {
                http.post('/logout').finally(() => {
                    this.token = '';
                    this.user = null;
                    localStorage.removeItem('bookhub_token');
                    window.location.reload();
                });
            },

            // Navigation and Data Loading
            async switchView(view) {
                this.activeView = view;
                await this.loadCurrentViewData();
            },
            async loadCurrentViewData() {
                if (!this.user) return;
                const view = this.activeView;
                if (view === 'dashboard') await this.loadDashboardStats();
                else if (view === 'users') await this.loadUsers();
                else if (view === 'categories') await this.loadCategories();
                else if (view === 'books') await this.loadBooks();
                else if (view === 'borrows') await this.loadBorrows();
                else if (view === 'profile') await this.loadProfile();
            },
            async loadDashboardStats() {
                try {
                    if (this.isAdmin) {
                        const [u, b, br] = await Promise.all([
                            http.get('/user/list', { params: { page: 1, size: 1 } }),
                            http.get('/book/list', { params: { page: 1, size: 1 } }),
                            http.get('/borrow/list', { params: { page: 1, size: 1 } })
                        ]);
                        this.usersTotal = u.total || 0;
                        this.booksTotal = b.total || 0;
                        this.borrowsTotal = br.total || 0;
                    } else {
                        const [b, br] = await Promise.all([
                            http.get('/book/list', { params: { page: 1, size: 1 } }),
                            http.get('/borrow/my', { params: { page: 1, size: 1 } })
                        ]);
                        this.booksTotal = b.total || 0;
                        this.borrowsTotal = br.total || 0;
                    }
                } catch (e) {
                    console.error('Dashboard data load failed', e);
                }
            },
            async loadUsers() {
                this.tableLoading = true;
                try {
                    const data = await http.get('/user/list', { params: this.userQuery });
                    this.users = data.records || [];
                    this.usersTotal = data.total || 0;
                } finally { this.tableLoading = false; }
            },
            async loadCategories() {
                this.tableLoading = true;
                try {
                    const data = await http.get('/category/list', { params: this.categoryQuery });
                    this.categories = data.records || [];
                    this.categoriesTotal = data.total || 0;
                } finally { this.tableLoading = false; }
            },
            async loadBooks() {
                this.tableLoading = true;
                try {
                    const [data, catData] = await Promise.all([
                        http.get('/book/list', { params: this.bookQuery }),
                        http.get('/category/list') // Get all for dropdown
                    ]);
                    this.books = data.records || [];
                    this.booksTotal = data.total || 0;
                    this.categories = catData || []; // listAll returns direct list
                } finally { this.tableLoading = false; }
            },
            async loadBorrows() {
                this.tableLoading = true;
                try {
                    const path = this.isAdmin ? '/borrow/list' : '/borrow/my';
                    const data = await http.get(path, { params: this.borrowQuery });
                    this.borrows = data.records || [];
                    this.borrowsTotal = data.total || 0;
                } finally { this.tableLoading = false; }
            },
            async loadProfile() {
                this.profileForm = await http.get('/profile');
                this.passwordForm = { oldPassword: '', newPassword: '' };
            },

            // UI Actions
            resetPage(q) { q.page = 1; },
            onUserPageChange(p) { this.userQuery.page = p; this.loadUsers(); },
            onCategoryPageChange(p) { this.categoryQuery.page = p; this.loadCategories(); },
            onBookPageChange(p) { this.bookQuery.page = p; this.loadBooks(); },
            onBorrowPageChange(p) { this.borrowQuery.page = p; this.loadBorrows(); },

            // User Management
            openUserDialog(row) {
                this.userForm = row ? { ...emptyUserForm(), ...row, password: '' } : emptyUserForm();
                this.userDialogTitle = row ? '编辑用户' : '新增用户';
                this.userDialogVisible = true;
            },
            async saveUser() {
                this.submitting = true;
                try {
                    const path = this.userForm.id ? '/user/update' : '/user/add';
                    await http.post(path, this.userForm);
                    ElMessage.success('用户信息已保存');
                    this.userDialogVisible = false;
                    await this.loadUsers();
                } finally { this.submitting = false; }
            },
            async deleteUser(row) {
                await ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '提示', { type: 'warning' });
                await http.delete('/user/delete', { params: { id: row.id } });
                ElMessage.success('已删除');
                await this.loadUsers();
            },

            // Category Management
            openCategoryDialog(row) {
                this.categoryForm = row ? { ...emptyCategoryForm(), ...row } : emptyCategoryForm();
                this.categoryDialogTitle = row ? '编辑分类' : '新增分类';
                this.categoryDialogVisible = true;
            },
            async saveCategory() {
                this.submitting = true;
                try {
                    const path = this.categoryForm.id ? '/category/update' : '/category/add';
                    await http.post(path, this.categoryForm);
                    ElMessage.success('分类已保存');
                    this.categoryDialogVisible = false;
                    await this.loadCategories();
                } finally { this.submitting = false; }
            },
            async deleteCategory(row) {
                await ElMessageBox.confirm(`确定删除分类「${row.categoryName}」吗？`, '提示', { type: 'warning' });
                await http.delete('/category/delete', { params: { id: row.id } });
                ElMessage.success('已删除');
                await this.loadCategories();
            },

            // Book Management
            openBookDialog(row) {
                this.bookForm = row ? { ...emptyBookForm(), ...row } : emptyBookForm();
                this.bookDialogTitle = row ? '编辑图书' : '新增图书';
                this.bookDialogVisible = true;
            },
            async saveBook() {
                this.submitting = true;
                try {
                    const path = this.bookForm.id ? '/book/update' : '/book/add';
                    await http.post(path, this.bookForm);
                    ElMessage.success('图书信息已保存');
                    this.bookDialogVisible = false;
                    await this.loadBooks();
                } finally { this.submitting = false; }
            },
            async deleteBook(row) {
                await ElMessageBox.confirm(`确定下架/删除图书「${row.bookName}」吗？`, '提示', { type: 'warning' });
                await http.delete('/book/delete', { params: { id: row.id } });
                ElMessage.success('已处理');
                await this.loadBooks();
            },

            // Borrow and Return
            async borrowBook(row) {
                this.borrowingId = row.id;
                try {
                    await http.post('/borrow/add', { bookId: row.id });
                    ElMessage.success('借阅成功');
                    await this.loadBooks();
                } finally { this.borrowingId = null; }
            },
            async returnBook(row) {
                this.returningId = row.id;
                try {
                    await http.post('/borrow/return', { recordId: row.id });
                    ElMessage.success('归还成功');
                    await this.loadBorrows();
                } finally { this.returningId = null; }
            },

            // Profile
            async saveProfile() {
                this.submitting = true;
                try {
                    await http.post('/profile/update', { realName: this.profileForm.realName, phone: this.profileForm.phone });
                    ElMessage.success('资料已保存');
                    this.user.realName = this.profileForm.realName;
                } finally { this.submitting = false; }
            },
            async changePassword() {
                this.submitting = true;
                try {
                    await http.post('/profile/password', this.passwordForm);
                    ElMessage.success('密码已更新');
                    this.passwordForm = { oldPassword: '', newPassword: '' };
                } finally { this.submitting = false; }
            }
        },
        template: `
            <div id="app-wrapper">
                <transition name="fade" mode="out-in">
                    <div v-if="!user" class="login-page" key="login">
                        <el-card class="login-card">
                            <div class="login-title">BookHub</div>
                            <div class="login-subtitle">数字化图书馆管理系统</div>
                            <el-form :model="loginForm" label-position="top" @submit.prevent="login" style="margin-top:24px">
                                <el-form-item label="用户名">
                                    <el-input v-model="loginForm.username" prefix-icon="User" placeholder="admin / student" />
                                </el-form-item>
                                <el-form-item label="密码">
                                    <el-input v-model="loginForm.password" type="password" prefix-icon="Lock" show-password @keyup.enter="login" />
                                </el-form-item>
                                <el-button type="primary" class="full-button" size="large" :loading="loading" @click="login">登录系统</el-button>
                            </el-form>
                        </el-card>
                    </div>

                    <el-container v-else class="app-shell" key="app">
                        <el-aside width="240px" class="sidebar">
                            <div class="brand">
                                <el-icon><Notebook /></el-icon>
                                <span>BookHub</span>
                            </div>
                            <el-menu :default-active="activeView" class="side-menu" @select="switchView">
                                <el-menu-item v-for="m in menus" :key="m.key" :index="m.key">
                                    <el-icon><component :is="m.icon" /></el-icon>
                                    <span>{{ m.label }}</span>
                                </el-menu-item>
                            </el-menu>
                        </el-aside>

                        <el-container>
                            <el-header class="topbar">
                                <div class="page-title">{{ currentTitle }}</div>
                                <div class="header-right" style="display:flex;align-items:center;gap:20px">
                                    <span style="font-size:14px;color:var(--color-text-light)">
                                        {{ user.realName }} ({{ roleText(user.role) }})
                                    </span>
                                    <el-button type="info" link @click="logout">退出</el-button>
                                </div>
                            </el-header>

                            <el-main class="main">
                                <transition name="fade" mode="out-in">
                                    <div :key="activeView">
                                        <section v-if="activeView === 'dashboard'">
                                            <el-row :gutter="20">
                                                <el-col :span="8" v-for="c in dashboardCards" :key="c.label">
                                                    <el-card shadow="never" class="stat-card">
                                                        <div class="stat-value">{{ c.value }}</div>
                                                        <div class="stat-label">{{ c.label }}</div>
                                                        <el-icon class="stat-icon"><component :is="c.icon" /></el-icon>
                                                    </el-card>
                                                </el-col>
                                            </el-row>
                                            <el-card shadow="never" style="margin-top:20px">
                                                <template #header><div style="font-weight:700">欢迎使用</div></template>
                                                <p style="color:var(--color-text-light)">
                                                    BookHub 旨在提供简洁、高效的图书借阅管理体验。
                                                    {{ isAdmin ? '您可以管理系统用户、维护图书目录及查看全馆借阅记录。' : '您可以浏览馆藏图书、查看借阅历史并管理个人资料。' }}
                                                </p>
                                            </el-card>
                                        </section>

                                        <section v-else-if="activeView === 'users'">
                                            <el-card shadow="never">
                                                <el-form :inline="true" :model="userQuery" class="toolbar">
                                                    <el-form-item label="用户名"><el-input v-model="userQuery.username" clearable /></el-form-item>
                                                    <el-form-item label="姓名"><el-input v-model="userQuery.realName" clearable /></el-form-item>
                                                    <el-button type="primary" @click="resetPage(userQuery); loadUsers()">查询</el-button>
                                                    <el-button @click="openUserDialog()">新增用户</el-button>
                                                </el-form>
                                                <el-table :data="users" v-loading="tableLoading">
                                                    <el-table-column prop="username" label="用户名" />
                                                    <el-table-column prop="realName" label="姓名" />
                                                    <el-table-column prop="phone" label="手机号" />
                                                    <el-table-column label="角色"><template #default="{row}">{{roleText(row.role)}}</template></el-table-column>
                                                    <el-table-column label="状态"><template #default="{row}"><el-tag :type="row.status === 1 ? 'success' : 'danger'">{{statusText(row.status)}}</el-tag></template></el-table-column>
                                                    <el-table-column label="操作" width="150" align="right">
                                                        <template #default="{row}">
                                                            <el-button link type="primary" @click="openUserDialog(row)">编辑</el-button>
                                                            <el-button link type="danger" @click="deleteUser(row)">删除</el-button>
                                                        </template>
                                                    </el-table-column>
                                                </el-table>
                                                <el-pagination layout="total, prev, pager, next" :total="usersTotal" :page-size="userQuery.size" @current-change="onUserPageChange" />
                                            </el-card>
                                        </section>

                                        <section v-else-if="activeView === 'categories'">
                                            <el-card shadow="never">
                                                <el-form :inline="true" :model="categoryQuery" class="toolbar">
                                                    <el-form-item label="关键词"><el-input v-model="categoryQuery.keyword" clearable /></el-form-item>
                                                    <el-button type="primary" @click="resetPage(categoryQuery); loadCategories()">查询</el-button>
                                                    <el-button @click="openCategoryDialog()">新增分类</el-button>
                                                </el-form>
                                                <el-table :data="categories" v-loading="tableLoading">
                                                    <el-table-column prop="categoryName" label="分类名称" />
                                                    <el-table-column prop="description" label="描述" />
                                                    <el-table-column label="操作" width="150" align="right">
                                                        <template #default="{row}">
                                                            <el-button link type="primary" @click="openCategoryDialog(row)">编辑</el-button>
                                                            <el-button link type="danger" @click="deleteCategory(row)">删除</el-button>
                                                        </template>
                                                    </el-table-column>
                                                </el-table>
                                                <el-pagination layout="total, prev, pager, next" :total="categoriesTotal" :page-size="categoryQuery.size" @current-change="onCategoryPageChange" />
                                            </el-card>
                                        </section>

                                        <section v-else-if="activeView === 'books'">
                                            <el-card shadow="never">
                                                <el-form :inline="true" :model="bookQuery" class="toolbar">
                                                    <el-form-item label="书名"><el-input v-model="bookQuery.bookName" clearable /></el-form-item>
                                                    <el-form-item label="分类">
                                                        <el-select v-model="bookQuery.categoryId" clearable placeholder="全部" style="width:140px">
                                                            <el-option v-for="c in categories" :key="c.id" :label="c.categoryName" :value="c.id" />
                                                        </el-select>
                                                    </el-form-item>
                                                    <el-button type="primary" @click="resetPage(bookQuery); loadBooks()">搜索</el-button>
                                                    <el-button v-if="isAdmin" @click="openBookDialog()">添加图书</el-button>
                                                </el-form>
                                                <el-table :data="books" v-loading="tableLoading">
                                                    <el-table-column label="书名与出版信息" min-width="200">
                                                        <template #default="{row}">
                                                            <div style="font-weight:600;color:var(--color-text)">{{row.bookName}}</div>
                                                            <div class="text-muted">{{row.publisher}}</div>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="作者与分类" min-width="120">
                                                        <template #default="{row}">
                                                            <div>{{row.author}}</div>
                                                            <div class="text-muted">{{row.categoryName}}</div>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="库存情况" width="120">
                                                        <template #default="{row}">
                                                            <div class="stock-info">
                                                                <span>{{row.availableCount}} / {{row.totalCount}}</span>
                                                                <el-tag size="small" :type="getStockTag(row.availableCount, row.totalCount)">
                                                                    {{row.availableCount === 0 ? '无库存' : '充足'}}
                                                                </el-tag>
                                                            </div>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="状态" width="100">
                                                        <template #default="{row}"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{bookStatusText(row.status)}}</el-tag></template>
                                                    </el-table-column>
                                                    <el-table-column label="操作" width="150" align="right">
                                                        <template #default="{row}">
                                                            <el-button v-if="!isAdmin && row.availableCount > 0" link type="primary" :loading="borrowingId === row.id" @click="borrowBook(row)">借阅</el-button>
                                                            <el-button v-if="isAdmin" link type="primary" @click="openBookDialog(row)">编辑</el-button>
                                                            <el-button v-if="isAdmin" link type="danger" @click="deleteBook(row)">删除</el-button>
                                                        </template>
                                                    </el-table-column>
                                                </el-table>
                                                <el-pagination layout="total, prev, pager, next" :total="booksTotal" :page-size="bookQuery.size" @current-change="onBookPageChange" />
                                            </el-card>
                                        </section>

                                        <section v-else-if="activeView === 'borrows'">
                                            <el-card shadow="never">
                                                <el-table :data="borrows" v-loading="tableLoading">
                                                    <el-table-column v-if="isAdmin" prop="userName" label="借阅人" />
                                                    <el-table-column prop="bookName" label="书名" min-width="150" />
                                                    <el-table-column label="借阅与归还" min-width="200">
                                                        <template #default="{row}">
                                                            <div style="font-size: 13px;">借: {{formatTime(row.borrowTime)}}</div>
                                                            <div class="text-muted">还: {{formatTime(row.dueTime)}}</div>
                                                        </template>
                                                    </el-table-column>
                                                    <el-table-column label="状态" width="100">
                                                        <template #default="{row}"><el-tag :type="getBorrowStatusTag(row.status)">{{row.status}}</el-tag></template>
                                                    </el-table-column>
                                                    <el-table-column label="操作" width="100" align="right">
                                                        <template #default="{row}">
                                                            <el-button v-if="row.canReturn" link type="primary" :loading="returningId === row.id" @click="returnBook(row)">马上归还</el-button>
                                                        </template>
                                                    </el-table-column>
                                                </el-table>
                                                <el-pagination layout="total, prev, pager, next" :total="borrowsTotal" :page-size="borrowQuery.size" @current-change="onBorrowPageChange" />
                                            </el-card>
                                        </section>

                                        <section v-else-if="activeView === 'profile'">
                                            <el-row :gutter="20">
                                                <el-col :span="12">
                                                    <el-card shadow="never" header="个人资料">
                                                        <el-form label-width="80px">
                                                            <el-form-item label="用户名"><el-input v-model="profileForm.username" disabled /></el-form-item>
                                                            <el-form-item label="姓名"><el-input v-model="profileForm.realName" /></el-form-item>
                                                            <el-form-item label="电话"><el-input v-model="profileForm.phone" /></el-form-item>
                                                            <el-form-item><el-button type="primary" :loading="submitting" @click="saveProfile">保存资料</el-button></el-form-item>
                                                        </el-form>
                                                    </el-card>
                                                </el-col>
                                                <el-col :span="12">
                                                    <el-card shadow="never" header="安全设置">
                                                        <el-form label-width="80px">
                                                            <el-form-item label="旧密码"><el-input v-model="passwordForm.oldPassword" type="password" show-password /></el-form-item>
                                                            <el-form-item label="新密码"><el-input v-model="passwordForm.newPassword" type="password" show-password /></el-form-item>
                                                            <el-form-item><el-button type="primary" :loading="submitting" @click="changePassword">修改密码</el-button></el-form-item>
                                                        </el-form>
                                                    </el-card>
                                                </el-col>
                                            </el-row>
                                        </section>
                                    </div>
                                </transition>
                            </el-main>
                        </el-container>
                    </el-container>
                </transition>

                <!-- Dialogs -->
                <el-dialog v-model="userDialogVisible" :title="userDialogTitle" width="460px">
                    <el-form label-width="80px" :model="userForm">
                        <el-form-item label="用户名"><el-input v-model="userForm.username" :disabled="!!userForm.id" /></el-form-item>
                        <el-form-item label="密码" v-if="!userForm.id"><el-input v-model="userForm.password" type="password" placeholder="默认 123456" /></el-form-item>
                        <el-form-item label="姓名"><el-input v-model="userForm.realName" /></el-form-item>
                        <el-form-item label="手机"><el-input v-model="userForm.phone" /></el-form-item>
                        <el-form-item label="角色">
                            <el-radio-group v-model="userForm.role">
                                <el-radio value="user">普通用户</el-radio>
                                <el-radio value="admin">管理员</el-radio>
                            </el-radio-group>
                        </el-form-item>
                        <el-form-item label="状态">
                            <el-switch v-model="userForm.status" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-form>
                    <template #footer><el-button type="primary" :loading="submitting" @click="saveUser">确认保存</el-button></template>
                </el-dialog>

                <el-dialog v-model="bookDialogVisible" :title="bookDialogTitle" width="500px">
                    <el-form label-width="80px" :model="bookForm">
                        <el-form-item label="书名"><el-input v-model="bookForm.bookName" /></el-form-item>
                        <el-form-item label="作者"><el-input v-model="bookForm.author" /></el-form-item>
                        <el-form-item label="出版社"><el-input v-model="bookForm.publisher" /></el-form-item>
                        <el-form-item label="分类">
                            <el-select v-model="bookForm.categoryId" style="width:100%">
                                <el-option v-for="c in categories" :key="c.id" :label="c.categoryName" :value="c.id" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="总数量"><el-input-number v-model="bookForm.totalCount" :min="1" /></el-form-item>
                        <el-form-item label="可借数"><el-input-number v-model="bookForm.availableCount" :min="0" /></el-form-item>
                        <el-form-item label="状态"><el-switch v-model="bookForm.status" :active-value="1" :inactive-value="0" /></el-form-item>
                    </el-form>
                    <template #footer><el-button type="primary" :loading="submitting" @click="saveBook">确认保存</el-button></template>
                </el-dialog>

                <el-dialog v-model="categoryDialogVisible" :title="categoryDialogTitle" width="460px">
                    <el-form label-width="80px" :model="categoryForm">
                        <el-form-item label="名称"><el-input v-model="categoryForm.categoryName" /></el-form-item>
                        <el-form-item label="描述"><el-input v-model="categoryForm.description" type="textarea" :rows="3" /></el-form-item>
                    </el-form>
                    <template #footer><el-button type="primary" :loading="submitting" @click="saveCategory">确认保存</el-button></template>
                </el-dialog>
            </div>
        `
    });

    // Icon registration on the correct app instance
    if (typeof ElementPlusIconsVue !== 'undefined') {
        for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
            app.component(key, component);
        }
    }

    app.use(ElementPlus).mount('#app');
})();
