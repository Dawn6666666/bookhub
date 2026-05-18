package org.example.bookhub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.bookhub.common.PageResponse;
import org.example.bookhub.common.StatusConstants;
import org.example.bookhub.domain.Book;
import org.example.bookhub.domain.BorrowRecord;
import org.example.bookhub.domain.User;
import org.example.bookhub.dto.response.BorrowRecordVO;
import org.example.bookhub.exception.BizException;
import org.example.bookhub.exception.NotFoundException;
import org.example.bookhub.mapper.BookMapper;
import org.example.bookhub.mapper.BorrowRecordMapper;
import org.example.bookhub.mapper.UserMapper;
import org.example.bookhub.service.BorrowService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class BorrowServiceImpl extends ServiceImpl<BorrowRecordMapper, BorrowRecord> implements BorrowService {

    private final BorrowRecordMapper borrowRecordMapper;
    private final BookMapper bookMapper;
    private final UserMapper userMapper;

    public BorrowServiceImpl(BorrowRecordMapper borrowRecordMapper, BookMapper bookMapper, UserMapper userMapper) {
        this.borrowRecordMapper = borrowRecordMapper;
        this.bookMapper = bookMapper;
        this.userMapper = userMapper;
    }

    @Override
    @Transactional
    public void borrow(Long userId, Long bookId) {
        User user = findUser(userId);
        Book book = findBook(bookId);
        if (!Objects.equals(book.getStatus(), StatusConstants.ENABLED)) {
            throw new BizException("图书已下架，暂时不能借阅");
        }
        if (book.getAvailableCount() <= 0) {
            throw new BizException("图书库存不足");
        }
        long activeBorrow = borrowRecordMapper.selectCount(new LambdaQueryWrapper<BorrowRecord>()
                .eq(BorrowRecord::getUserId, userId)
                .eq(BorrowRecord::getBookId, bookId)
                .eq(BorrowRecord::getStatus, StatusConstants.BORROWED));
        if (activeBorrow > 0) {
            throw new BizException("同一用户不能重复借阅同一本未归还图书");
        }

        BorrowRecord record = new BorrowRecord();
        record.setUserId(userId);
        record.setBookId(bookId);
        record.setBorrowTime(LocalDateTime.now());
        record.setDueTime(LocalDateTime.now().plusDays(30));
        record.setStatus(StatusConstants.BORROWED);
        borrowRecordMapper.insert(record);

        book.setAvailableCount(book.getAvailableCount() - 1);
        bookMapper.updateById(book);
    }

    @Override
    @Transactional
    public void returnBook(Long userId, Long recordId) {
        BorrowRecord record = borrowRecordMapper.selectById(recordId);
        if (record == null) {
            throw new NotFoundException("借阅记录不存在");
        }
        if (!Objects.equals(record.getUserId(), userId)) {
            throw new BizException("只能归还自己的借阅记录");
        }
        if (!Objects.equals(record.getStatus(), StatusConstants.BORROWED)) {
            throw new BizException("该图书已归还");
        }

        Book book = findBook(record.getBookId());
        record.setReturnTime(LocalDateTime.now());
        record.setStatus(StatusConstants.RETURNED);
        borrowRecordMapper.updateById(record);

        book.setAvailableCount(Math.min(book.getAvailableCount() + 1, book.getTotalCount()));
        bookMapper.updateById(book);
    }

    @Override
    public PageResponse<BorrowRecordVO> pageRecords(Integer page, Integer size, String userName, String bookName, String status, Long currentUserId, boolean admin) {
        Map<Long, String> userMap = userMapper.selectList(null).stream().collect(Collectors.toMap(User::getId, User::getUsername));
        Map<Long, String> bookMap = bookMapper.selectList(null).stream().collect(Collectors.toMap(Book::getId, Book::getBookName));
        List<BorrowRecordVO> records = borrowRecordMapper.selectList(null).stream()
                .filter(record -> admin || Objects.equals(record.getUserId(), currentUserId))
                .filter(record -> status == null || status.isBlank() || Objects.equals(status, record.getStatus()))
                .filter(record -> isBlank(userName) || containsIgnoreCase(userMap.get(record.getUserId()), userName))
                .filter(record -> isBlank(bookName) || containsIgnoreCase(bookMap.get(record.getBookId()), bookName))
                .sorted(Comparator.comparing(BorrowRecord::getBorrowTime, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(record -> toVo(record, userMap.get(record.getUserId()), bookMap.get(record.getBookId()), Objects.equals(record.getUserId(), currentUserId)))
                .collect(Collectors.toList());
        return PageResponse.of(records, page, size);
    }

    private User findUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new NotFoundException("用户不存在");
        }
        return user;
    }

    private Book findBook(Long bookId) {
        Book book = bookMapper.selectById(bookId);
        if (book == null) {
            throw new NotFoundException("图书不存在");
        }
        return book;
    }

    private BorrowRecordVO toVo(BorrowRecord record, String userName, String bookName, boolean canReturn) {
        BorrowRecordVO vo = new BorrowRecordVO();
        BeanUtils.copyProperties(record, vo);
        vo.setUserName(userName);
        vo.setBookName(bookName);
        vo.setCanReturn(canReturn && Objects.equals(record.getStatus(), StatusConstants.BORROWED));
        return vo;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean containsIgnoreCase(String source, String keyword) {
        return source != null && source.toLowerCase().contains(keyword.toLowerCase());
    }
}
