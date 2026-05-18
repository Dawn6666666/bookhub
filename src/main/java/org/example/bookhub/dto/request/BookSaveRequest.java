package org.example.bookhub.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class BookSaveRequest {

    private Long id;

    @NotBlank
    private String bookName;

    @NotBlank
    private String author;

    @NotBlank
    private String publisher;

    @NotNull
    private Long categoryId;

    @NotNull
    @Min(0)
    private Integer totalCount;

    @Min(0)
    private Integer availableCount;

    @NotNull
    private Integer status;
}
