package org.example.bookhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserSaveRequest {

    private Long id;

    @NotBlank
    private String username;

    private String password;

    @NotBlank
    private String realName;

    private String phone;

    @NotBlank
    private String role;

    @NotNull
    private Integer status;
}
