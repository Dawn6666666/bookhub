package org.example.bookhub.dto.request;

import lombok.Data;

@Data
public class QueryPageRequest {

    private Integer page = 1;
    private Integer size = 10;
}
