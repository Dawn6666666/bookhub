package org.example.bookhub.controller;

import jakarta.validation.Valid;
import org.example.bookhub.common.ApiResponse;
import org.example.bookhub.common.PageResponse;
import org.example.bookhub.common.RoleConstants;
import org.example.bookhub.context.AuthContext;
import org.example.bookhub.dto.request.CategorySaveRequest;
import org.example.bookhub.dto.response.CategoryVO;
import org.example.bookhub.exception.ForbiddenException;
import org.example.bookhub.service.CategoryService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping("/category/list")
    public ApiResponse<?> list(@RequestParam(required = false) Integer page,
                               @RequestParam(required = false) Integer size,
                               @RequestParam(required = false) String keyword) {
        if (page == null && size == null) {
            return ApiResponse.success(categoryService.listAll());
        }
        ensureAdmin();
        return ApiResponse.success(categoryService.pageCategories(defaultPage(page), defaultSize(size), keyword));
    }

    @GetMapping("/category/detail")
    public ApiResponse<CategoryVO> detail(@RequestParam Long id) {
        ensureAdmin();
        return ApiResponse.success(categoryService.detail(id));
    }

    @PostMapping("/category/add")
    public ApiResponse<Void> add(@Valid @RequestBody CategorySaveRequest request) {
        ensureAdmin();
        categoryService.create(request);
        return ApiResponse.success("新增成功", null);
    }

    @PostMapping("/category/update")
    public ApiResponse<Void> update(@Valid @RequestBody CategorySaveRequest request) {
        ensureAdmin();
        categoryService.update(request);
        return ApiResponse.success("修改成功", null);
    }

    @DeleteMapping("/category/delete")
    public ApiResponse<Void> delete(@RequestParam Long id) {
        ensureAdmin();
        categoryService.delete(id);
        return ApiResponse.success("删除成功", null);
    }

    private void ensureAdmin() {
        if (!RoleConstants.ADMIN.equals(AuthContext.get().getRole())) {
            throw new ForbiddenException("只有管理员可以访问该功能");
        }
    }

    private int defaultPage(Integer page) {
        return page == null || page < 1 ? 1 : page;
    }

    private int defaultSize(Integer size) {
        return size == null || size < 1 ? 10 : size;
    }
}
