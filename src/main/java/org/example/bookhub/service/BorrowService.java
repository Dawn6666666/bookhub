package org.example.bookhub.service;

import org.example.bookhub.common.PageResponse;
import org.example.bookhub.dto.response.BorrowRecordVO;

public interface BorrowService {

    void borrow(Long userId, Long bookId);

    void returnBook(Long userId, Long recordId);

    PageResponse<BorrowRecordVO> pageRecords(Integer page, Integer size, String userName, String bookName, String status, Long currentUserId, boolean admin);
}
