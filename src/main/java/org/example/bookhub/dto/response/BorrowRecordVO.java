package org.example.bookhub.dto.response;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BorrowRecordVO {

    private Long id;
    private Long userId;
    private String userName;
    private Long bookId;
    private String bookName;
    private LocalDateTime borrowTime;
    private LocalDateTime dueTime;
    private LocalDateTime returnTime;
    private String status;
    private boolean canReturn;
}
