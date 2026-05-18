package org.example.bookhub.service;

import org.example.bookhub.dto.request.LoginRequest;
import org.example.bookhub.dto.response.LoginResponse;
import org.example.bookhub.dto.response.ProfileVO;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    void logout(String token);

    ProfileVO currentProfile(Long userId);
}
