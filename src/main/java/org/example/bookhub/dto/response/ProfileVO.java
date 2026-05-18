package org.example.bookhub.dto.response;

import lombok.Data;

@Data
public class ProfileVO {

    private Long id;
    private String username;
    private String realName;
    private String phone;
    private String role;
    private Integer status;
}
