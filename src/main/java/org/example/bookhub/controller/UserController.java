package org.example.bookhub.controller;

import jakarta.validation.Valid;
import org.example.bookhub.common.ApiResponse;
import org.example.bookhub.common.PageResponse;
import org.example.bookhub.common.RoleConstants;
import org.example.bookhub.context.AuthContext;
import org.example.bookhub.dto.request.ChangePasswordRequest;
import org.example.bookhub.dto.request.ProfileUpdateRequest;
import org.example.bookhub.dto.request.UserSaveRequest;
import org.example.bookhub.dto.response.ProfileVO;
import org.example.bookhub.dto.response.UserVO;
import org.example.bookhub.exception.ForbiddenException;
import org.example.bookhub.service.UserService;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/user/list")
    public ApiResponse<PageResponse<UserVO>> list(@RequestParam(required = false) Integer page,
                                                  @RequestParam(required = false) Integer size,
                                                  @RequestParam(required = false) String username,
                                                  @RequestParam(required = false) String realName,
                                                  @RequestParam(required = false) Integer status) {
        ensureAdmin();
        return ApiResponse.success(userService.pageUsers(defaultPage(page), defaultSize(size), username, realName, status));
    }

    @GetMapping("/user/detail")
    public ApiResponse<UserVO> detail(@RequestParam Long id) {
        ensureAdmin();
        return ApiResponse.success(userService.detail(id));
    }

    @PostMapping("/user/add")
    public ApiResponse<Void> add(@Valid @RequestBody UserSaveRequest request) {
        ensureAdmin();
        userService.create(request);
        return ApiResponse.success("新增成功", null);
    }

    @PostMapping("/user/update")
    public ApiResponse<Void> update(@Valid @RequestBody UserSaveRequest request) {
        ensureAdmin();
        userService.update(request);
        return ApiResponse.success("修改成功", null);
    }

    @DeleteMapping("/user/delete")
    public ApiResponse<Void> delete(@RequestParam Long id) {
        ensureAdmin();
        userService.delete(id);
        return ApiResponse.success("删除成功", null);
    }

    @GetMapping("/profile")
    public ApiResponse<ProfileVO> profile() {
        return ApiResponse.success(userService.profile(AuthContext.get().getUserId()));
    }

    @PostMapping("/profile/update")
    public ApiResponse<Void> updateProfile(@RequestBody ProfileUpdateRequest request) {
        userService.updateProfile(AuthContext.get().getUserId(), request);
        return ApiResponse.success("保存成功", null);
    }

    @PostMapping("/profile/password")
    public ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(AuthContext.get().getUserId(), request);
        return ApiResponse.success("密码已更新", null);
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
