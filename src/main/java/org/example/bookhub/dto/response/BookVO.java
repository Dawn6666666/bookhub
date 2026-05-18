package org.example.bookhub.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookVO {

    private Long id;
    private String bookName;
    private String author;
    private String publisher;
    private Long categoryId;
    private String categoryName;
    private Integer totalCount;
    private Integer availableCount;
    private Integer borrowedCount;
    private Integer status;
    private LocalDateTime createTime;
}
