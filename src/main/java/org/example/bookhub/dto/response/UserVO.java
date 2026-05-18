package org.example.bookhub.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserVO {

    private Long id;
    private String username;
    private String realName;
    private String phone;
    private String role;
    private Integer status;
    private LocalDateTime createTime;
}
