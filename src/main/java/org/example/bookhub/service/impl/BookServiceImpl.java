package org.example.bookhub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.bookhub.common.PageResponse;
import org.example.bookhub.common.StatusConstants;
import org.example.bookhub.domain.Book;
import org.example.bookhub.domain.BookCategory;
import org.example.bookhub.domain.BorrowRecord;
import org.example.bookhub.dto.request.BookSaveRequest;
import org.example.bookhub.dto.response.BookVO;
import org.example.bookhub.exception.BizException;
import org.example.bookhub.exception.NotFoundException;
import org.example.bookhub.mapper.BookCategoryMapper;
import org.example.bookhub.mapper.BookMapper;
import org.example.bookhub.mapper.BorrowRecordMapper;
import org.example.bookhub.service.BookService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class BookServiceImpl extends ServiceImpl<BookMapper, Book> implements BookService {

    private final BookMapper bookMapper;
    private final BookCategoryMapper categoryMapper;
    private final BorrowRecordMapper borrowRecordMapper;

    public BookServiceImpl(BookMapper bookMapper, BookCategoryMapper categoryMapper, BorrowRecordMapper borrowRecordMapper) {
        this.bookMapper = bookMapper;
        this.categoryMapper = categoryMapper;
        this.borrowRecordMapper = borrowRecordMapper;
    }

    @Override
    public PageResponse<BookVO> pageBooks(Integer page, Integer size, String bookName, String author, Long categoryId, Integer status) {
        List<BookVO> records = toVoList(bookMapper.selectList(null)).stream()
                .filter(book -> isBlank(bookName) || containsIgnoreCase(book.getBookName(), bookName))
                .filter(book -> isBlank(author) || containsIgnoreCase(book.getAuthor(), author))
                .filter(book -> categoryId == null || Objects.equals(categoryId, book.getCategoryId()))
                .filter(book -> status == null || Objects.equals(status, book.getStatus()))
                .sorted(Comparator.comparing(BookVO::getId).reversed())
                .collect(Collectors.toList());
        return PageResponse.of(records, page, size);
    }

    @Override
    public BookVO detail(Long id) {
        return toVo(findBook(id));
    }

    @Override
    @Transactional
    public void create(BookSaveRequest request) {
        ensureCategoryExists(request.getCategoryId());
        Book book = new Book();
        book.setBookName(request.getBookName());
        book.setAuthor(request.getAuthor());
        book.setPublisher(request.getPublisher());
        book.setCategoryId(request.getCategoryId());
        book.setTotalCount(request.getTotalCount());
        book.setAvailableCount(request.getAvailableCount() == null ? request.getTotalCount() : request.getAvailableCount());
        if (book.getAvailableCount() > book.getTotalCount()) {
            throw new BizException("可借数量不能大于总数量");
        }
        book.setStatus(request.getStatus() == null ? StatusConstants.ENABLED : request.getStatus());
        bookMapper.insert(book);
    }

    @Override
    @Transactional
    public void update(BookSaveRequest request) {
        Book book = findBook(request.getId());
        ensureCategoryExists(request.getCategoryId());
        int borrowedCount = Math.max(book.getTotalCount() - book.getAvailableCount(), 0);
        if (request.getTotalCount() < borrowedCount) {
            throw new BizException("总数量不能小于已借出数量");
        }
        int availableCount = request.getAvailableCount() == null ? request.getTotalCount() - borrowedCount : request.getAvailableCount();
        if (availableCount < 0 || availableCount > request.getTotalCount()) {
            throw new BizException("可借数量不合法");
        }
        if (request.getTotalCount() - availableCount != borrowedCount) {
            throw new BizException("总数量、可借数量和已借出数量必须一致");
        }
        book.setBookName(request.getBookName());
        book.setAuthor(request.getAuthor());
        book.setPublisher(request.getPublisher());
        book.setCategoryId(request.getCategoryId());
        book.setTotalCount(request.getTotalCount());
        book.setAvailableCount(availableCount);
        book.setStatus(request.getStatus());
        bookMapper.updateById(book);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        findBook(id);
        long activeBorrowCount = borrowRecordMapper.selectCount(new LambdaQueryWrapper<BorrowRecord>()
                .eq(BorrowRecord::getBookId, id)
                .eq(BorrowRecord::getStatus, StatusConstants.BORROWED));
        if (activeBorrowCount > 0) {
            throw new BizException("该图书还有未归还记录，不能删除");
        }
        bookMapper.deleteById(id);
    }

    private void ensureCategoryExists(Long categoryId) {
        BookCategory category = categoryMapper.selectById(categoryId);
        if (category == null) {
            throw new NotFoundException("图书分类不存在");
        }
    }

    private Book findBook(Long id) {
        Book book = bookMapper.selectById(id);
        if (book == null) {
            throw new NotFoundException("图书不存在");
        }
        return book;
    }

    private List<BookVO> toVoList(List<Book> books) {
        Map<Long, String> categoryMap = categoryMapper.selectList(null).stream()
                .collect(Collectors.toMap(BookCategory::getId, BookCategory::getCategoryName));
        return books.stream().map(book -> toVo(book, categoryMap.get(book.getCategoryId()))).collect(Collectors.toList());
    }

    private BookVO toVo(Book book) {
        String categoryName = categoryMapper.selectById(book.getCategoryId()) == null ? null : categoryMapper.selectById(book.getCategoryId()).getCategoryName();
        return toVo(book, categoryName);
    }

    private BookVO toVo(Book book, String categoryName) {
        BookVO vo = new BookVO();
        BeanUtils.copyProperties(book, vo);
        vo.setCategoryName(categoryName);
        vo.setBorrowedCount(Math.max(book.getTotalCount() - book.getAvailableCount(), 0));
        return vo;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean containsIgnoreCase(String source, String keyword) {
        return source != null && source.toLowerCase().contains(keyword.toLowerCase());
    }
}
