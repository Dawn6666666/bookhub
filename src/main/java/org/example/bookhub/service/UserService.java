package org.example.bookhub.service;

import org.example.bookhub.common.PageResponse;
import org.example.bookhub.dto.request.ChangePasswordRequest;
import org.example.bookhub.dto.request.ProfileUpdateRequest;
import org.example.bookhub.dto.request.UserSaveRequest;
import org.example.bookhub.dto.response.ProfileVO;
import org.example.bookhub.dto.response.UserVO;

public interface UserService {

    PageResponse<UserVO> pageUsers(Integer page, Integer size, String username, String realName, Integer status);

    UserVO detail(Long id);

    void create(UserSaveRequest request);

    void update(UserSaveRequest request);

    void delete(Long id);

    ProfileVO profile(Long userId);

    void updateProfile(Long userId, ProfileUpdateRequest request);

    void changePassword(Long userId, ChangePasswordRequest request);
}
