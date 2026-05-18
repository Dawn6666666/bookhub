package org.example.bookhub.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.bookhub.context.AuthContext;
import org.example.bookhub.exception.UnauthorizedException;
import org.example.bookhub.security.TokenStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final TokenStore tokenStore;

    @Value("${bookhub.auth-token-header:X-Auth-Token}")
    private String tokenHeader;

    public AuthInterceptor(TokenStore tokenStore) {
        this.tokenStore = tokenStore;
    }

    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        String token = request.getHeader(tokenHeader);
        if (token == null || token.isBlank()) {
            token = request.getParameter("token");
        }
        if (token == null || token.isBlank()) {
            throw new UnauthorizedException("请先登录");
        }
        AuthContext.set(tokenStore.get(token).orElseThrow(() -> new UnauthorizedException("登录已失效，请重新登录")));
        request.setAttribute("authToken", token);
        return true;
    }

    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        AuthContext.clear();
    }
}
