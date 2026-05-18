package org.example.bookhub.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.example.bookhub.common.ApiResponse;
import org.example.bookhub.context.AuthContext;
import org.example.bookhub.dto.request.LoginRequest;
import org.example.bookhub.dto.response.LoginResponse;
import org.example.bookhub.dto.response.ProfileVO;
import org.example.bookhub.service.AuthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ApiResponse<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ApiResponse.success(authService.login(request));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpServletRequest request) {
        Object token = request.getAttribute("authToken");
        authService.logout(token == null ? null : token.toString());
        return ApiResponse.success("退出成功", null);
    }

    @GetMapping("/me")
    public ApiResponse<ProfileVO> me() {
        return ApiResponse.success(authService.currentProfile(AuthContext.get().getUserId()));
    }
}
