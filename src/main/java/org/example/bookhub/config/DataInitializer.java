package org.example.bookhub.config;

import org.example.bookhub.common.RoleConstants;
import org.example.bookhub.common.StatusConstants;
import org.example.bookhub.domain.Book;
import org.example.bookhub.domain.BookCategory;
import org.example.bookhub.domain.User;
import org.example.bookhub.mapper.BookCategoryMapper;
import org.example.bookhub.mapper.BookMapper;
import org.example.bookhub.mapper.UserMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserMapper userMapper;
    private final BookCategoryMapper categoryMapper;
    private final BookMapper bookMapper;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserMapper userMapper,
                           BookCategoryMapper categoryMapper,
                           BookMapper bookMapper,
                           PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.categoryMapper = categoryMapper;
        this.bookMapper = bookMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (userMapper.selectCount(null) == 0) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRealName("系统管理员");
            admin.setPhone("13800000000");
            admin.setRole(RoleConstants.ADMIN);
            admin.setStatus(StatusConstants.ENABLED);
            userMapper.insert(admin);

            User student = new User();
            student.setUsername("student");
            student.setPassword(passwordEncoder.encode("123456"));
            student.setRealName("张同学");
            student.setPhone("13900000000");
            student.setRole(RoleConstants.USER);
            student.setStatus(StatusConstants.ENABLED);
            userMapper.insert(student);
        }

        if (categoryMapper.selectCount(null) == 0) {
            List<BookCategory> categories = List.of(
                    category("计算机类", "Java、数据库、计算机网络等图书"),
                    category("文学类", "小说、散文、诗歌等图书"),
                    category("历史类", "历史文化相关图书")
            );
            categories.forEach(categoryMapper::insert);
        }

        if (bookMapper.selectCount(null) == 0) {
            Long computerId = categoryMapper.selectList(null).stream()
                    .filter(item -> "计算机类".equals(item.getCategoryName()))
                    .findFirst().map(BookCategory::getId).orElse(null);
            Long literatureId = categoryMapper.selectList(null).stream()
                    .filter(item -> "文学类".equals(item.getCategoryName()))
                    .findFirst().map(BookCategory::getId).orElse(null);
            Long historyId = categoryMapper.selectList(null).stream()
                    .filter(item -> "历史类".equals(item.getCategoryName()))
                    .findFirst().map(BookCategory::getId).orElse(null);

            List<Book> books = List.of(
                    book("Spring Boot 实战", "张三", "机械工业出版社", computerId, 8),
                    book("Java 核心技术", "凯瑟琳", "电子工业出版社", computerId, 5),
                    book("平凡的世界", "路遥", "人民文学出版社", literatureId, 4),
                    book("中国通史", "吕思勉", "中华书局", historyId, 3)
            );
            books.forEach(bookMapper::insert);
        }
    }

    private BookCategory category(String name, String description) {
        BookCategory category = new BookCategory();
        category.setCategoryName(name);
        category.setDescription(description);
        return category;
    }

    private Book book(String name, String author, String publisher, Long categoryId, int totalCount) {
        Book book = new Book();
        book.setBookName(name);
        book.setAuthor(author);
        book.setPublisher(publisher);
        book.setCategoryId(categoryId);
        book.setTotalCount(totalCount);
        book.setAvailableCount(totalCount);
        book.setStatus(StatusConstants.ENABLED);
        return book;
    }
}
