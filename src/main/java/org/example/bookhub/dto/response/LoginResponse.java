package org.example.bookhub.dto.response;

import lombok.Data;

@Data
public class LoginResponse {

    private String token;
    private Long userId;
    private String username;
    private String realName;
    private String role;
}
