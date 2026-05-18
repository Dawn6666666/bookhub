package org.example.bookhub.dto.request;

import jakarta.validation.constraints.NotNull;

public class ReturnRequest {

    @NotNull
    private Long recordId;

    public Long getRecordId() {
        return recordId;
    }

    public void setRecordId(Long recordId) {
        this.recordId = recordId;
    }
}
