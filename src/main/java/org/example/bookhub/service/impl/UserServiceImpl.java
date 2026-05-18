package org.example.bookhub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.bookhub.common.PageResponse;
import org.example.bookhub.common.StatusConstants;
import org.example.bookhub.domain.BorrowRecord;
import org.example.bookhub.domain.User;
import org.example.bookhub.dto.request.ChangePasswordRequest;
import org.example.bookhub.dto.request.ProfileUpdateRequest;
import org.example.bookhub.dto.request.UserSaveRequest;
import org.example.bookhub.dto.response.ProfileVO;
import org.example.bookhub.dto.response.UserVO;
import org.example.bookhub.exception.BizException;
import org.example.bookhub.exception.NotFoundException;
import org.example.bookhub.mapper.BorrowRecordMapper;
import org.example.bookhub.mapper.UserMapper;
import org.example.bookhub.service.UserService;
import org.springframework.beans.BeanUtils;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private final UserMapper userMapper;
    private final BorrowRecordMapper borrowRecordMapper;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserMapper userMapper, BorrowRecordMapper borrowRecordMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.borrowRecordMapper = borrowRecordMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public PageResponse<UserVO> pageUsers(Integer page, Integer size, String username, String realName, Integer status) {
        List<UserVO> records = userMapper.selectList(null).stream()
                .filter(user -> isBlank(username) || containsIgnoreCase(user.getUsername(), username))
                .filter(user -> isBlank(realName) || containsIgnoreCase(user.getRealName(), realName))
                .filter(user -> status == null || Objects.equals(status, user.getStatus()))
                .sorted(Comparator.comparing(User::getId).reversed())
                .map(this::toVo)
                .collect(Collectors.toList());
        return PageResponse.of(records, page, size);
    }

    @Override
    public UserVO detail(Long id) {
        return toVo(findUser(id));
    }

    @Override
    @Transactional
    public void create(UserSaveRequest request) {
        ensureUsernameUnique(request.getUsername(), null);
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(encodeOrDefault(request.getPassword()));
        user.setRealName(request.getRealName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setStatus(request.getStatus() == null ? StatusConstants.ENABLED : request.getStatus());
        userMapper.insert(user);
    }

    @Override
    @Transactional
    public void update(UserSaveRequest request) {
        User user = findUser(request.getId());
        ensureUsernameUnique(request.getUsername(), request.getId());
        user.setUsername(request.getUsername());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        user.setRealName(request.getRealName());
        user.setPhone(request.getPhone());
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());
        userMapper.updateById(user);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        User user = findUser(id);
        long activeBorrowCount = borrowRecordMapper.selectCount(new LambdaQueryWrapper<BorrowRecord>()
                .eq(BorrowRecord::getUserId, id)
                .eq(BorrowRecord::getStatus, StatusConstants.BORROWED));
        if (activeBorrowCount > 0) {
            throw new BizException("该用户还有未归还图书，不能删除");
        }
        userMapper.deleteById(user.getId());
    }

    @Override
    public ProfileVO profile(Long userId) {
        return toProfile(findUser(userId));
    }

    @Override
    @Transactional
    public void updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = findUser(userId);
        if (request.getRealName() != null && !request.getRealName().isBlank()) {
            user.setRealName(request.getRealName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        userMapper.updateById(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new BizException("旧密码不正确");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userMapper.updateById(user);
    }

    private User findUser(Long id) {
        User user = userMapper.selectById(id);
        if (user == null) {
            throw new NotFoundException("用户不存在");
        }
        return user;
    }

    private void ensureUsernameUnique(String username, Long ignoreId) {
        long count = userMapper.selectCount(new LambdaQueryWrapper<User>()
                .eq(User::getUsername, username)
                .ne(ignoreId != null, User::getId, ignoreId));
        if (count > 0) {
            throw new BizException("用户名已存在");
        }
    }

    private String encodeOrDefault(String password) {
        String value = (password == null || password.isBlank()) ? "123456" : password;
        return passwordEncoder.encode(value);
    }

    private UserVO toVo(User user) {
        UserVO vo = new UserVO();
        BeanUtils.copyProperties(user, vo);
        return vo;
    }

    private ProfileVO toProfile(User user) {
        ProfileVO vo = new ProfileVO();
        BeanUtils.copyProperties(user, vo);
        return vo;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean containsIgnoreCase(String source, String keyword) {
        return source != null && source.toLowerCase().contains(keyword.toLowerCase());
    }
}
