(function () {
    const { createApp } = Vue;
    const { ElMessage, ElMessageBox } = ElementPlus;

    const emptyUserForm = () => ({ id: null, username: '', password: '', realName: '', phone: '', role: 'user', status: 1 });
    const emptyCategoryForm = () => ({ id: null, categoryName: '', description: '' });
    const emptyBookForm = () => ({ id: null, bookName: '', author: '', publisher: '', categoryId: null, totalCount: 1, availableCount: 1, status: 1 });

    createApp({
        data() {
            return {
                token: localStorage.getItem('bookhub_token') || '',
                user: null,
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
                profileForm: { id: null, username: '', realName: '', phone: '', role: '', status: 1 },
                passwordForm: { oldPassword: '', newPassword: '' },
                users: [],
                usersTotal: 0,
                categories: [],
                categoriesTotal: 0,
                books: [],
                booksTotal: 0,
                borrows: [],
                borrowsTotal: 0,
                userDialogVisible: false,
                categoryDialogVisible: false,
                bookDialogVisible: false,
                bookDetailVisible: false,
                userDialogTitle: '',
                categoryDialogTitle: '',
                bookDialogTitle: '',
                userForm: emptyUserForm(),
                categoryForm: emptyCategoryForm(),
                bookForm: emptyBookForm(),
                currentBook: null
            };
        },
        computed: {
            isAdmin() {
                return this.user && this.user.role === 'admin';
            },
            menus() {
                if (this.isAdmin) {
                    return [
                        { key: 'dashboard', label: '首页' },
                        { key: 'users', label: '用户管理' },
                        { key: 'categories', label: '图书分类' },
                        { key: 'books', label: '图书管理' },
                        { key: 'borrows', label: '借阅记录' }
                    ];
                }
                return [
                    { key: 'dashboard', label: '首页' },
                    { key: 'books', label: '图书查询' },
                    { key: 'borrows', label: '我的借阅' },
                    { key: 'profile', label: '个人信息' }
                ];
            },
            currentTitle() {
                const item = this.menus.find(menu => menu.key === this.activeView);
                return item ? item.label : '首页';
            },
            dashboardCards() {
                return [
                    { label: '图书数量', value: this.booksTotal || this.books.length || 0 },
                    { label: '分类数量', value: this.categoriesTotal || this.categories.length || 0 },
                    { label: '借阅记录', value: this.borrowsTotal || this.borrows.length || 0 }
                ];
            }
        },
        mounted() {
            this.bootstrap();
        },
        methods: {
            async api(path, options = {}) {
                const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
                if (this.token) {
                    headers['X-Auth-Token'] = this.token;
                }
                const resp = await fetch(path, Object.assign({}, options, { headers }));
                const payload = await resp.json();
                if (payload.code !== 0) {
                    throw new Error(payload.message || '请求失败');
                }
                return payload.data;
            },
            queryString(query) {
                const params = new URLSearchParams();
                Object.entries(query).forEach(([key, value]) => {
                    if (value !== '' && value !== null && value !== undefined) {
                        params.append(key, value);
                    }
                });
                return params.toString();
            },
            formatTime(value) {
                return value ? String(value).replace('T', ' ').slice(0, 19) : '';
            },
            statusText(status) {
                return Number(status) === 1 ? '正常' : '禁用';
            },
            bookStatusText(status) {
                return Number(status) === 1 ? '正常' : '下架';
            },
            roleText(role) {
                return role === 'admin' ? '管理员' : '普通用户';
            },
            notifyError(err, fallback) {
                ElMessage.error(err && err.message ? err.message : fallback);
            },
            async bootstrap() {
                if (this.token) {
                    try {
                        this.user = await this.api('/me');
                        this.activeView = this.isAdmin ? 'dashboard' : 'books';
                        await this.loadCurrent();
                        return;
                    } catch (err) {
                        this.token = '';
                        localStorage.removeItem('bookhub_token');
                    }
                }
            },
            async login() {
                this.loading = true;
                try {
                    const data = await this.api('/login', {
                        method: 'POST',
                        body: JSON.stringify(this.loginForm),
                        headers: {}
                    });
                    this.token = data.token;
                    localStorage.setItem('bookhub_token', data.token);
                    this.user = { id: data.userId, userId: data.userId, username: data.username, realName: data.realName, role: data.role };
                    this.activeView = this.isAdmin ? 'dashboard' : 'books';
                    ElMessage.success('登录成功');
                    await this.loadCurrent();
                } catch (err) {
                    this.notifyError(err, '登录失败');
                } finally {
                    this.loading = false;
                }
            },
            async logout() {
                try {
                    await this.api('/logout', { method: 'POST', body: '{}' });
                } catch (err) {
                }
                this.token = '';
                this.user = null;
                this.activeView = 'dashboard';
                localStorage.removeItem('bookhub_token');
            },
            async switchView(view) {
                this.activeView = view;
                await this.loadCurrent();
            },
            async loadCurrent() {
                if (!this.user) return;
                if (this.activeView === 'users') await this.loadUsers();
                else if (this.activeView === 'categories') await this.loadCategories();
                else if (this.activeView === 'books') await this.loadBooks();
                else if (this.activeView === 'borrows') await this.loadBorrows();
                else if (this.activeView === 'profile') await this.loadProfile();
                else await this.loadDashboardData();
            },
            async loadDashboardData() {
                try {
                    await Promise.all([this.loadCategoryOptions(), this.loadBooks(false), this.loadBorrows(false)]);
                } catch (err) {
                }
            },
            async loadCategoryOptions() {
                this.categories = await this.api('/category/list');
            },
            async loadUsers() {
                this.tableLoading = true;
                try {
                    const data = await this.api('/user/list?' + this.queryString(this.userQuery));
                    this.users = data.records || [];
                    this.usersTotal = data.total || 0;
                } catch (err) {
                    this.notifyError(err, '用户加载失败');
                } finally {
                    this.tableLoading = false;
                }
            },
            async loadCategories() {
                this.tableLoading = true;
                try {
                    const data = await this.api('/category/list?' + this.queryString(this.categoryQuery));
                    this.categories = data.records || [];
                    this.categoriesTotal = data.total || 0;
                } catch (err) {
                    this.notifyError(err, '分类加载失败');
                } finally {
                    this.tableLoading = false;
                }
            },
            async loadBooks(showLoading = true) {
                if (showLoading) this.tableLoading = true;
                try {
                    const [data, categories] = await Promise.all([
                        this.api('/book/list?' + this.queryString(this.bookQuery)),
                        this.api('/category/list')
                    ]);
                    this.books = data.records || [];
                    this.booksTotal = data.total || 0;
                    this.categories = categories || [];
                } catch (err) {
                    this.notifyError(err, '图书加载失败');
                } finally {
                    if (showLoading) this.tableLoading = false;
                }
            },
            async loadBorrows(showLoading = true) {
                if (showLoading) this.tableLoading = true;
                try {
                    const path = this.isAdmin ? '/borrow/list' : '/borrow/my';
                    const query = this.isAdmin
                        ? this.borrowQuery
                        : { page: this.borrowQuery.page, size: this.borrowQuery.size, bookName: this.borrowQuery.bookName, status: this.borrowQuery.status };
                    const data = await this.api(path + '?' + this.queryString(query));
                    this.borrows = data.records || [];
                    this.borrowsTotal = data.total || 0;
                } catch (err) {
                    this.notifyError(err, '借阅记录加载失败');
                } finally {
                    if (showLoading) this.tableLoading = false;
                }
            },
            async loadProfile() {
                try {
                    this.profileForm = await this.api('/profile');
                    this.passwordForm = { oldPassword: '', newPassword: '' };
                } catch (err) {
                    this.notifyError(err, '个人信息加载失败');
                }
            },
            resetPage(query) {
                query.page = 1;
            },
            async onUserPageChange(page) {
                this.userQuery.page = page;
                await this.loadUsers();
            },
            async onCategoryPageChange(page) {
                this.categoryQuery.page = page;
                await this.loadCategories();
            },
            async onBookPageChange(page) {
                this.bookQuery.page = page;
                await this.loadBooks();
            },
            async onBorrowPageChange(page) {
                this.borrowQuery.page = page;
                await this.loadBorrows();
            },
            openUserDialog(row) {
                this.userForm = row ? Object.assign(emptyUserForm(), row, { password: '' }) : emptyUserForm();
                this.userDialogTitle = row ? '编辑用户' : '新增用户';
                this.userDialogVisible = true;
            },
            async saveUser() {
                this.submitting = true;
                try {
                    const path = this.userForm.id ? '/user/update' : '/user/add';
                    await this.api(path, { method: 'POST', body: JSON.stringify(this.userForm) });
                    ElMessage.success('保存成功');
                    this.userDialogVisible = false;
                    await this.loadUsers();
                } catch (err) {
                    this.notifyError(err, '保存失败');
                } finally {
                    this.submitting = false;
                }
            },
            async deleteUser(row) {
                await ElMessageBox.confirm(`确定删除用户「${row.username}」吗？`, '提示', { type: 'warning' });
                try {
                    await this.api('/user/delete?id=' + encodeURIComponent(row.id), { method: 'DELETE' });
                    ElMessage.success('删除成功');
                    await this.loadUsers();
                } catch (err) {
                    this.notifyError(err, '删除失败');
                }
            },
            openCategoryDialog(row) {
                this.categoryForm = row ? Object.assign(emptyCategoryForm(), row) : emptyCategoryForm();
                this.categoryDialogTitle = row ? '编辑分类' : '新增分类';
                this.categoryDialogVisible = true;
            },
            async saveCategory() {
                this.submitting = true;
                try {
                    const path = this.categoryForm.id ? '/category/update' : '/category/add';
                    await this.api(path, { method: 'POST', body: JSON.stringify(this.categoryForm) });
                    ElMessage.success('保存成功');
                    this.categoryDialogVisible = false;
                    await this.loadCategories();
                } catch (err) {
                    this.notifyError(err, '保存失败');
                } finally {
                    this.submitting = false;
                }
            },
            async deleteCategory(row) {
                await ElMessageBox.confirm(`确定删除分类「${row.categoryName}」吗？`, '提示', { type: 'warning' });
                try {
                    await this.api('/category/delete?id=' + encodeURIComponent(row.id), { method: 'DELETE' });
                    ElMessage.success('删除成功');
                    await this.loadCategories();
                } catch (err) {
                    this.notifyError(err, '删除失败');
                }
            },
            openBookDialog(row) {
                this.bookForm = row ? Object.assign(emptyBookForm(), row) : emptyBookForm();
                if (!this.bookForm.categoryId && this.categories.length) {
                    this.bookForm.categoryId = this.categories[0].id;
                }
                this.bookDialogTitle = row ? '编辑图书' : '新增图书';
                this.bookDialogVisible = true;
            },
            async saveBook() {
                this.submitting = true;
                try {
                    const payload = Object.assign({}, this.bookForm, {
                        categoryId: Number(this.bookForm.categoryId),
                        totalCount: Number(this.bookForm.totalCount),
                        availableCount: Number(this.bookForm.availableCount),
                        status: Number(this.bookForm.status)
                    });
                    const path = payload.id ? '/book/update' : '/book/add';
                    await this.api(path, { method: 'POST', body: JSON.stringify(payload) });
                    ElMessage.success('保存成功');
                    this.bookDialogVisible = false;
                    await this.loadBooks();
                } catch (err) {
                    this.notifyError(err, '保存失败');
                } finally {
                    this.submitting = false;
                }
            },
            async deleteBook(row) {
                await ElMessageBox.confirm(`确定删除图书「${row.bookName}」吗？`, '提示', { type: 'warning' });
                try {
                    await this.api('/book/delete?id=' + encodeURIComponent(row.id), { method: 'DELETE' });
                    ElMessage.success('删除成功');
                    await this.loadBooks();
                } catch (err) {
                    this.notifyError(err, '删除失败');
                }
            },
            showBook(row) {
                this.currentBook = row;
                this.bookDetailVisible = true;
            },
            async borrowBook(row) {
                if (this.borrowingId) return;
                this.borrowingId = row.id;
                try {
                    await this.api('/borrow/add', { method: 'POST', body: JSON.stringify({ bookId: Number(row.id) }) });
                    ElMessage.success('借阅成功');
                    await this.loadBooks();
                } catch (err) {
                    this.notifyError(err, '借阅失败');
                } finally {
                    this.borrowingId = null;
                }
            },
            async returnBook(row) {
                if (this.returningId) return;
                this.returningId = row.id;
                try {
                    await this.api('/borrow/return', { method: 'POST', body: JSON.stringify({ recordId: Number(row.id) }) });
                    ElMessage.success('归还成功');
                    await this.loadBorrows();
                } catch (err) {
                    this.notifyError(err, '归还失败');
                } finally {
                    this.returningId = null;
                }
            },
            async saveProfile() {
                this.submitting = true;
                try {
                    await this.api('/profile/update', {
                        method: 'POST',
                        body: JSON.stringify({ realName: this.profileForm.realName, phone: this.profileForm.phone })
                    });
                    ElMessage.success('保存成功');
                    this.user.realName = this.profileForm.realName;
                    await this.loadProfile();
                } catch (err) {
                    this.notifyError(err, '保存失败');
                } finally {
                    this.submitting = false;
                }
            },
            async changePassword() {
                this.submitting = true;
                try {
                    await this.api('/profile/password', { method: 'POST', body: JSON.stringify(this.passwordForm) });
                    this.passwordForm = { oldPassword: '', newPassword: '' };
                    ElMessage.success('密码已更新');
                } catch (err) {
                    this.notifyError(err, '修改失败');
                } finally {
                    this.submitting = false;
                }
            }
        },
        template: `
            <div v-if="!user" class="login-page">
                <el-card class="login-card" shadow="never">
                    <div class="login-title">BookHub 图书管理系统</div>
                    <div class="login-subtitle">默认账号：admin / admin123，student / 123456</div>
                    <el-form :model="loginForm" label-position="top" @submit.prevent="login">
                        <el-form-item label="用户名">
                            <el-input v-model="loginForm.username" placeholder="请输入用户名" @keyup.enter="login" />
                        </el-form-item>
                        <el-form-item label="密码">
                            <el-input v-model="loginForm.password" type="password" show-password placeholder="请输入密码" @keyup.enter="login" />
                        </el-form-item>
                        <el-button type="primary" class="full-button" :loading="loading" @click="login">登录</el-button>
                    </el-form>
                </el-card>
            </div>

            <el-container v-else class="app-shell">
                <el-aside width="220px" class="sidebar">
                    <div class="brand">BookHub</div>
                    <el-menu :default-active="activeView" class="side-menu" @select="switchView">
                        <el-menu-item v-for="item in menus" :key="item.key" :index="item.key">{{ item.label }}</el-menu-item>
                    </el-menu>
                </el-aside>

                <el-container>
                    <el-header class="topbar">
                        <div>
                            <div class="page-title">{{ currentTitle }}</div>
                            <div class="page-subtitle">当前用户：{{ user.realName }} / {{ roleText(user.role) }}</div>
                        </div>
                        <el-button @click="logout">退出登录</el-button>
                    </el-header>

                    <el-main class="main">
                        <section v-if="activeView === 'dashboard'" class="view">
                            <el-row :gutter="16" class="stat-row">
                                <el-col :span="8" v-for="card in dashboardCards" :key="card.label">
                                    <el-card shadow="never" class="stat-card">
                                        <div class="stat-value">{{ card.value }}</div>
                                        <div class="stat-label">{{ card.label }}</div>
                                    </el-card>
                                </el-col>
                            </el-row>
                            <el-card shadow="never">
                                <template #header>欢迎回来</template>
                                <p>{{ isAdmin ? '你可以管理用户、分类、图书和借阅记录。' : '你可以查询图书、借阅图书、归还图书并维护个人信息。' }}</p>
                            </el-card>
                        </section>

                        <section v-if="activeView === 'users'" class="view">
                            <el-card shadow="never">
                                <el-form :inline="true" :model="userQuery" class="toolbar">
                                    <el-form-item label="用户名"><el-input v-model="userQuery.username" clearable /></el-form-item>
                                    <el-form-item label="真实姓名"><el-input v-model="userQuery.realName" clearable /></el-form-item>
                                    <el-form-item label="状态">
                                        <el-select v-model="userQuery.status" clearable placeholder="全部" style="width: 120px">
                                            <el-option label="正常" :value="1" />
                                            <el-option label="禁用" :value="0" />
                                        </el-select>
                                    </el-form-item>
                                    <el-form-item>
                                        <el-button type="primary" @click="resetPage(userQuery); loadUsers()">查询</el-button>
                                        <el-button @click="openUserDialog()">新增用户</el-button>
                                    </el-form-item>
                                </el-form>
                                <el-table :data="users" v-loading="tableLoading" border>
                                    <el-table-column prop="username" label="用户名" />
                                    <el-table-column prop="realName" label="真实姓名" />
                                    <el-table-column prop="phone" label="手机号" />
                                    <el-table-column label="角色"><template #default="{ row }">{{ roleText(row.role) }}</template></el-table-column>
                                    <el-table-column label="状态"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ statusText(row.status) }}</el-tag></template></el-table-column>
                                    <el-table-column label="创建时间"><template #default="{ row }">{{ formatTime(row.createTime) }}</template></el-table-column>
                                    <el-table-column label="操作" width="150">
                                        <template #default="{ row }">
                                            <el-button link type="primary" @click="openUserDialog(row)">编辑</el-button>
                                            <el-button link type="danger" @click="deleteUser(row)">删除</el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <el-pagination layout="prev, pager, next, total" :total="usersTotal" :page-size="userQuery.size" :current-page="userQuery.page" @current-change="onUserPageChange" />
                            </el-card>
                        </section>

                        <section v-if="activeView === 'categories'" class="view">
                            <el-card shadow="never">
                                <el-form :inline="true" :model="categoryQuery" class="toolbar">
                                    <el-form-item label="关键词"><el-input v-model="categoryQuery.keyword" clearable /></el-form-item>
                                    <el-form-item>
                                        <el-button type="primary" @click="resetPage(categoryQuery); loadCategories()">查询</el-button>
                                        <el-button @click="openCategoryDialog()">新增分类</el-button>
                                    </el-form-item>
                                </el-form>
                                <el-table :data="categories" v-loading="tableLoading" border>
                                    <el-table-column prop="categoryName" label="分类名称" />
                                    <el-table-column prop="description" label="分类描述" />
                                    <el-table-column label="创建时间"><template #default="{ row }">{{ formatTime(row.createTime) }}</template></el-table-column>
                                    <el-table-column label="操作" width="150">
                                        <template #default="{ row }">
                                            <el-button link type="primary" @click="openCategoryDialog(row)">编辑</el-button>
                                            <el-button link type="danger" @click="deleteCategory(row)">删除</el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <el-pagination layout="prev, pager, next, total" :total="categoriesTotal" :page-size="categoryQuery.size" :current-page="categoryQuery.page" @current-change="onCategoryPageChange" />
                            </el-card>
                        </section>

                        <section v-if="activeView === 'books'" class="view">
                            <el-card shadow="never">
                                <el-form :inline="true" :model="bookQuery" class="toolbar">
                                    <el-form-item label="书名"><el-input v-model="bookQuery.bookName" clearable /></el-form-item>
                                    <el-form-item label="作者"><el-input v-model="bookQuery.author" clearable /></el-form-item>
                                    <el-form-item label="分类">
                                        <el-select v-model="bookQuery.categoryId" clearable placeholder="全部" style="width: 150px">
                                            <el-option v-for="item in categories" :key="item.id" :label="item.categoryName" :value="item.id" />
                                        </el-select>
                                    </el-form-item>
                                    <el-form-item v-if="isAdmin" label="状态">
                                        <el-select v-model="bookQuery.status" clearable placeholder="全部" style="width: 120px">
                                            <el-option label="正常" :value="1" />
                                            <el-option label="下架" :value="0" />
                                        </el-select>
                                    </el-form-item>
                                    <el-form-item>
                                        <el-button type="primary" @click="resetPage(bookQuery); loadBooks()">查询</el-button>
                                        <el-button v-if="isAdmin" @click="openBookDialog()">新增图书</el-button>
                                    </el-form-item>
                                </el-form>
                                <el-table :data="books" v-loading="tableLoading" border>
                                    <el-table-column prop="bookName" label="书名" min-width="140" />
                                    <el-table-column prop="author" label="作者" />
                                    <el-table-column prop="publisher" label="出版社" />
                                    <el-table-column prop="categoryName" label="分类" />
                                    <el-table-column prop="totalCount" label="总数" width="80" />
                                    <el-table-column prop="availableCount" label="可借" width="80" />
                                    <el-table-column prop="borrowedCount" label="已借" width="80" />
                                    <el-table-column label="状态" width="90"><template #default="{ row }"><el-tag :type="row.status === 1 ? 'success' : 'info'">{{ bookStatusText(row.status) }}</el-tag></template></el-table-column>
                                    <el-table-column label="操作" width="220">
                                        <template #default="{ row }">
                                            <el-button link type="primary" @click="showBook(row)">详情</el-button>
                                            <el-button v-if="!isAdmin && row.availableCount > 0 && row.status === 1" link type="success" :loading="borrowingId === row.id" @click="borrowBook(row)">借阅</el-button>
                                            <el-button v-if="isAdmin" link type="primary" @click="openBookDialog(row)">编辑</el-button>
                                            <el-button v-if="isAdmin" link type="danger" @click="deleteBook(row)">删除</el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <el-pagination layout="prev, pager, next, total" :total="booksTotal" :page-size="bookQuery.size" :current-page="bookQuery.page" @current-change="onBookPageChange" />
                            </el-card>
                        </section>

                        <section v-if="activeView === 'borrows'" class="view">
                            <el-card shadow="never">
                                <el-form :inline="true" :model="borrowQuery" class="toolbar">
                                    <el-form-item v-if="isAdmin" label="用户名"><el-input v-model="borrowQuery.userName" clearable /></el-form-item>
                                    <el-form-item label="书名"><el-input v-model="borrowQuery.bookName" clearable /></el-form-item>
                                    <el-form-item label="状态">
                                        <el-select v-model="borrowQuery.status" clearable placeholder="全部" style="width: 130px">
                                            <el-option label="未归还" value="未归还" />
                                            <el-option label="已归还" value="已归还" />
                                        </el-select>
                                    </el-form-item>
                                    <el-form-item><el-button type="primary" @click="resetPage(borrowQuery); loadBorrows()">查询</el-button></el-form-item>
                                </el-form>
                                <el-table :data="borrows" v-loading="tableLoading" border>
                                    <el-table-column v-if="isAdmin" prop="userName" label="用户名" />
                                    <el-table-column prop="bookName" label="书名" />
                                    <el-table-column label="借阅时间"><template #default="{ row }">{{ formatTime(row.borrowTime) }}</template></el-table-column>
                                    <el-table-column label="应还时间"><template #default="{ row }">{{ formatTime(row.dueTime) }}</template></el-table-column>
                                    <el-table-column label="归还时间"><template #default="{ row }">{{ formatTime(row.returnTime) }}</template></el-table-column>
                                    <el-table-column label="状态"><template #default="{ row }"><el-tag :type="row.status === '已归还' ? 'success' : 'warning'">{{ row.status }}</el-tag></template></el-table-column>
                                    <el-table-column label="操作" width="100">
                                        <template #default="{ row }">
                                            <el-button v-if="row.canReturn" link type="primary" :loading="returningId === row.id" @click="returnBook(row)">归还</el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                                <el-pagination layout="prev, pager, next, total" :total="borrowsTotal" :page-size="borrowQuery.size" :current-page="borrowQuery.page" @current-change="onBorrowPageChange" />
                            </el-card>
                        </section>

                        <section v-if="activeView === 'profile'" class="view">
                            <el-row :gutter="16">
                                <el-col :span="12">
                                    <el-card shadow="never">
                                        <template #header>个人资料</template>
                                        <el-form label-width="90px" :model="profileForm">
                                            <el-form-item label="用户名"><el-input v-model="profileForm.username" disabled /></el-form-item>
                                            <el-form-item label="真实姓名"><el-input v-model="profileForm.realName" /></el-form-item>
                                            <el-form-item label="手机号"><el-input v-model="profileForm.phone" /></el-form-item>
                                            <el-form-item><el-button type="primary" :loading="submitting" @click="saveProfile">保存资料</el-button></el-form-item>
                                        </el-form>
                                    </el-card>
                                </el-col>
                                <el-col :span="12">
                                    <el-card shadow="never">
                                        <template #header>修改密码</template>
                                        <el-form label-width="90px" :model="passwordForm">
                                            <el-form-item label="旧密码"><el-input v-model="passwordForm.oldPassword" type="password" show-password /></el-form-item>
                                            <el-form-item label="新密码"><el-input v-model="passwordForm.newPassword" type="password" show-password /></el-form-item>
                                            <el-form-item><el-button type="primary" :loading="submitting" @click="changePassword">修改密码</el-button></el-form-item>
                                        </el-form>
                                    </el-card>
                                </el-col>
                            </el-row>
                        </section>
                    </el-main>
                </el-container>

                <el-dialog v-model="userDialogVisible" :title="userDialogTitle" width="560px">
                    <el-form label-width="90px" :model="userForm">
                        <el-form-item label="用户名"><el-input v-model="userForm.username" /></el-form-item>
                        <el-form-item label="密码"><el-input v-model="userForm.password" :placeholder="userForm.id ? '留空表示不修改' : '默认 123456'" /></el-form-item>
                        <el-form-item label="真实姓名"><el-input v-model="userForm.realName" /></el-form-item>
                        <el-form-item label="手机号"><el-input v-model="userForm.phone" /></el-form-item>
                        <el-form-item label="角色">
                            <el-select v-model="userForm.role">
                                <el-option label="普通用户" value="user" />
                                <el-option label="管理员" value="admin" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="状态">
                            <el-radio-group v-model="userForm.status">
                                <el-radio-button :value="1">正常</el-radio-button>
                                <el-radio-button :value="0">禁用</el-radio-button>
                            </el-radio-group>
                        </el-form-item>
                    </el-form>
                    <template #footer>
                        <el-button @click="userDialogVisible = false">取消</el-button>
                        <el-button type="primary" :loading="submitting" @click="saveUser">保存</el-button>
                    </template>
                </el-dialog>

                <el-dialog v-model="categoryDialogVisible" :title="categoryDialogTitle" width="520px">
                    <el-form label-width="90px" :model="categoryForm">
                        <el-form-item label="分类名称"><el-input v-model="categoryForm.categoryName" /></el-form-item>
                        <el-form-item label="分类描述"><el-input v-model="categoryForm.description" type="textarea" :rows="4" /></el-form-item>
                    </el-form>
                    <template #footer>
                        <el-button @click="categoryDialogVisible = false">取消</el-button>
                        <el-button type="primary" :loading="submitting" @click="saveCategory">保存</el-button>
                    </template>
                </el-dialog>

                <el-dialog v-model="bookDialogVisible" :title="bookDialogTitle" width="620px">
                    <el-form label-width="90px" :model="bookForm">
                        <el-form-item label="书名"><el-input v-model="bookForm.bookName" /></el-form-item>
                        <el-form-item label="作者"><el-input v-model="bookForm.author" /></el-form-item>
                        <el-form-item label="出版社"><el-input v-model="bookForm.publisher" /></el-form-item>
                        <el-form-item label="分类">
                            <el-select v-model="bookForm.categoryId" style="width: 100%">
                                <el-option v-for="item in categories" :key="item.id" :label="item.categoryName" :value="item.id" />
                            </el-select>
                        </el-form-item>
                        <el-form-item label="总数"><el-input-number v-model="bookForm.totalCount" :min="0" /></el-form-item>
                        <el-form-item label="可借"><el-input-number v-model="bookForm.availableCount" :min="0" /></el-form-item>
                        <el-form-item label="状态">
                            <el-radio-group v-model="bookForm.status">
                                <el-radio-button :value="1">正常</el-radio-button>
                                <el-radio-button :value="0">下架</el-radio-button>
                            </el-radio-group>
                        </el-form-item>
                    </el-form>
                    <template #footer>
                        <el-button @click="bookDialogVisible = false">取消</el-button>
                        <el-button type="primary" :loading="submitting" @click="saveBook">保存</el-button>
                    </template>
                </el-dialog>

                <el-dialog v-model="bookDetailVisible" title="图书详情" width="520px">
                    <el-descriptions v-if="currentBook" :column="1" border>
                        <el-descriptions-item label="书名">{{ currentBook.bookName }}</el-descriptions-item>
                        <el-descriptions-item label="作者">{{ currentBook.author }}</el-descriptions-item>
                        <el-descriptions-item label="出版社">{{ currentBook.publisher }}</el-descriptions-item>
                        <el-descriptions-item label="分类">{{ currentBook.categoryName }}</el-descriptions-item>
                        <el-descriptions-item label="总数量">{{ currentBook.totalCount }}</el-descriptions-item>
                        <el-descriptions-item label="可借数量">{{ currentBook.availableCount }}</el-descriptions-item>
                        <el-descriptions-item label="状态">{{ bookStatusText(currentBook.status) }}</el-descriptions-item>
                    </el-descriptions>
                </el-dialog>
            </el-container>
        `
    }).use(ElementPlus).mount('#app');
})();
