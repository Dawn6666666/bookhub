package org.example.bookhub.dto.request;

import jakarta.validation.constraints.NotNull;

public class BorrowRequest {

    @NotNull
    private Long bookId;

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }
}
