package org.example.bookhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CategorySaveRequest {

    private Long id;

    @NotBlank
    private String categoryName;

    private String description;
}
