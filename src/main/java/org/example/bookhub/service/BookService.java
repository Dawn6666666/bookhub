package org.example.bookhub.service;

import org.example.bookhub.common.PageResponse;
import org.example.bookhub.dto.request.BookSaveRequest;
import org.example.bookhub.dto.response.BookVO;

public interface BookService {

    PageResponse<BookVO> pageBooks(Integer page, Integer size, String bookName, String author, Long categoryId, Integer status);

    BookVO detail(Long id);

    void create(BookSaveRequest request);

    void update(BookSaveRequest request);

    void delete(Long id);
}
