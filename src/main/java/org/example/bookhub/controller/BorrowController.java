package org.example.bookhub.controller;

import jakarta.validation.Valid;
import org.example.bookhub.common.ApiResponse;
import org.example.bookhub.common.PageResponse;
import org.example.bookhub.common.RoleConstants;
import org.example.bookhub.context.AuthContext;
import org.example.bookhub.dto.request.BorrowRequest;
import org.example.bookhub.dto.request.ReturnRequest;
import org.example.bookhub.dto.response.BorrowRecordVO;
import org.example.bookhub.exception.ForbiddenException;
import org.example.bookhub.service.BorrowService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BorrowController {

    private final BorrowService borrowService;

    public BorrowController(BorrowService borrowService) {
        this.borrowService = borrowService;
    }

    @PostMapping("/borrow/add")
    public ApiResponse<Void> borrow(@Valid @RequestBody BorrowRequest request) {
        borrowService.borrow(AuthContext.get().getUserId(), request.getBookId());
        return ApiResponse.success("借阅成功", null);
    }

    @PostMapping("/borrow/return")
    public ApiResponse<Void> returnBook(@Valid @RequestBody ReturnRequest request) {
        borrowService.returnBook(AuthContext.get().getUserId(), request.getRecordId());
        return ApiResponse.success("归还成功", null);
    }

    @GetMapping("/borrow/list")
    public ApiResponse<PageResponse<BorrowRecordVO>> list(@RequestParam(required = false) Integer page,
                                                          @RequestParam(required = false) Integer size,
                                                          @RequestParam(required = false) String userName,
                                                          @RequestParam(required = false) String bookName,
                                                          @RequestParam(required = false) String status) {
        ensureAdmin();
        return ApiResponse.success(borrowService.pageRecords(defaultPage(page), defaultSize(size), userName, bookName, status, AuthContext.get().getUserId(), true));
    }

    @GetMapping("/borrow/my")
    public ApiResponse<PageResponse<BorrowRecordVO>> my(@RequestParam(required = false) Integer page,
                                                        @RequestParam(required = false) Integer size,
                                                        @RequestParam(required = false) String bookName,
                                                        @RequestParam(required = false) String status) {
        return ApiResponse.success(borrowService.pageRecords(defaultPage(page), defaultSize(size), null, bookName, status, AuthContext.get().getUserId(), false));
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
