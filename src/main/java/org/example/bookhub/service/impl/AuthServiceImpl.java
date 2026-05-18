package org.example.bookhub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.example.bookhub.common.StatusConstants;
import org.example.bookhub.domain.User;
import org.example.bookhub.dto.request.LoginRequest;
import org.example.bookhub.dto.response.LoginResponse;
import org.example.bookhub.dto.response.ProfileVO;
import org.example.bookhub.exception.ForbiddenException;
import org.example.bookhub.exception.NotFoundException;
import org.example.bookhub.exception.UnauthorizedException;
import org.example.bookhub.mapper.UserMapper;
import org.example.bookhub.security.AuthPrincipal;
import org.example.bookhub.security.TokenStore;
import org.example.bookhub.service.AuthService;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Objects;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final TokenStore tokenStore;

    public AuthServiceImpl(UserMapper userMapper, PasswordEncoder passwordEncoder, TokenStore tokenStore) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.tokenStore = tokenStore;
    }

    @Override
    public LoginResponse login(LoginRequest request) {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, request.getUsername()));
        if (user == null) {
            throw new NotFoundException("账号不存在");
        }
        if (!Objects.equals(user.getStatus(), StatusConstants.ENABLED)) {
            throw new ForbiddenException("账号已被禁用");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("用户名或密码错误");
        }
        AuthPrincipal principal = new AuthPrincipal(user.getId(), user.getUsername(), user.getRealName(), user.getRole());
        String token = tokenStore.issue(principal);
        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setUserId(user.getId());
        response.setUsername(user.getUsername());
        response.setRealName(user.getRealName());
        response.setRole(user.getRole());
        return response;
    }

    @Override
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            tokenStore.remove(token);
        }
    }

    @Override
    public ProfileVO currentProfile(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new NotFoundException("用户不存在");
        }
        ProfileVO vo = new ProfileVO();
        BeanUtils.copyProperties(user, vo);
        return vo;
    }
}
