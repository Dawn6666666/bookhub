package org.example.bookhub.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CategoryVO {

    private Long id;
    private String categoryName;
    private String description;
    private LocalDateTime createTime;
}
