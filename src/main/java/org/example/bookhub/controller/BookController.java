package org.example.bookhub.controller;

import jakarta.validation.Valid;
import org.example.bookhub.common.ApiResponse;
import org.example.bookhub.common.PageResponse;
import org.example.bookhub.common.RoleConstants;
import org.example.bookhub.context.AuthContext;
import org.example.bookhub.dto.request.BookSaveRequest;
import org.example.bookhub.dto.response.BookVO;
import org.example.bookhub.exception.ForbiddenException;
import org.example.bookhub.service.BookService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping("/book/list")
    public ApiResponse<PageResponse<BookVO>> list(@RequestParam(required = false) Integer page,
                                                  @RequestParam(required = false) Integer size,
                                                  @RequestParam(required = false) String bookName,
                                                  @RequestParam(required = false) String author,
                                                  @RequestParam(required = false) Long categoryId,
                                                  @RequestParam(required = false) Integer status) {
        return ApiResponse.success(bookService.pageBooks(defaultPage(page), defaultSize(size), bookName, author, categoryId, status));
    }

    @GetMapping("/book/detail")
    public ApiResponse<BookVO> detail(@RequestParam Long id) {
        return ApiResponse.success(bookService.detail(id));
    }

    @PostMapping("/book/add")
    public ApiResponse<Void> add(@Valid @RequestBody BookSaveRequest request) {
        ensureAdmin();
        bookService.create(request);
        return ApiResponse.success("新增成功", null);
    }

    @PostMapping("/book/update")
    public ApiResponse<Void> update(@Valid @RequestBody BookSaveRequest request) {
        ensureAdmin();
        bookService.update(request);
        return ApiResponse.success("修改成功", null);
    }

    @DeleteMapping("/book/delete")
    public ApiResponse<Void> delete(@RequestParam Long id) {
        ensureAdmin();
        bookService.delete(id);
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
