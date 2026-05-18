package org.example.bookhub;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import org.example.bookhub.common.StatusConstants;
import org.example.bookhub.domain.Book;
import org.example.bookhub.domain.BorrowRecord;
import org.example.bookhub.domain.User;
import org.example.bookhub.mapper.BookMapper;
import org.example.bookhub.mapper.BorrowRecordMapper;
import org.example.bookhub.mapper.UserMapper;
import org.example.bookhub.service.BorrowService;
import org.example.bookhub.service.AuthService;
import org.example.bookhub.dto.request.LoginRequest;
import org.example.bookhub.dto.response.LoginResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class BorrowFlowTests {

    @Autowired
    private AuthService authService;

    @Autowired
    private BorrowService borrowService;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private BookMapper bookMapper;

    @Autowired
    private BorrowRecordMapper borrowRecordMapper;

    @Test
    void loginAndBorrowReturnShouldWork() {
        LoginResponse login = authService.login(loginRequest("student", "123456"));
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, login.getUsername()));
        Book book = bookMapper.selectOne(new LambdaQueryWrapper<Book>().eq(Book::getBookName, "Spring Boot 实战"));
        int before = book.getAvailableCount();

        borrowService.borrow(user.getId(), book.getId());
        Book afterBorrow = bookMapper.selectById(book.getId());
        assertThat(afterBorrow.getAvailableCount()).isEqualTo(before - 1);

        BorrowRecord record = borrowRecordMapper.selectOne(new LambdaQueryWrapper<BorrowRecord>()
                .eq(BorrowRecord::getUserId, user.getId())
                .eq(BorrowRecord::getBookId, book.getId())
                .eq(BorrowRecord::getStatus, StatusConstants.BORROWED));
        assertThat(record).isNotNull();

        borrowService.returnBook(user.getId(), record.getId());
        Book afterReturn = bookMapper.selectById(book.getId());
        assertThat(afterReturn.getAvailableCount()).isEqualTo(before);
    }

    @Test
    void duplicateBorrowShouldFail() {
        User user = userMapper.selectOne(new LambdaQueryWrapper<User>().eq(User::getUsername, "student"));
        Book book = bookMapper.selectOne(new LambdaQueryWrapper<Book>().eq(Book::getBookName, "Java 核心技术"));

        borrowService.borrow(user.getId(), book.getId());
        assertThrows(RuntimeException.class, () -> borrowService.borrow(user.getId(), book.getId()));
    }

    private LoginRequest loginRequest(String username, String password) {
        LoginRequest request = new LoginRequest();
        request.setUsername(username);
        request.setPassword(password);
        return request;
    }
}
