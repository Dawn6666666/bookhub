package org.example.bookhub.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.example.bookhub.common.PageResponse;
import org.example.bookhub.domain.Book;
import org.example.bookhub.domain.BookCategory;
import org.example.bookhub.dto.request.CategorySaveRequest;
import org.example.bookhub.dto.response.CategoryVO;
import org.example.bookhub.exception.BizException;
import org.example.bookhub.exception.NotFoundException;
import org.example.bookhub.mapper.BookMapper;
import org.example.bookhub.mapper.BookCategoryMapper;
import org.example.bookhub.service.CategoryService;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl extends ServiceImpl<BookCategoryMapper, BookCategory> implements CategoryService {

    private final BookCategoryMapper categoryMapper;
    private final BookMapper bookMapper;

    public CategoryServiceImpl(BookCategoryMapper categoryMapper, BookMapper bookMapper) {
        this.categoryMapper = categoryMapper;
        this.bookMapper = bookMapper;
    }

    @Override
    public PageResponse<CategoryVO> pageCategories(Integer page, Integer size, String keyword) {
        List<CategoryVO> records = categoryMapper.selectList(null).stream()
                .filter(category -> keyword == null || keyword.isBlank() || containsIgnoreCase(category.getCategoryName(), keyword)
                        || containsIgnoreCase(category.getDescription(), keyword))
                .sorted(Comparator.comparing(BookCategory::getId).reversed())
                .map(this::toVo)
                .collect(Collectors.toList());
        return PageResponse.of(records, page, size);
    }

    @Override
    public List<CategoryVO> listAll() {
        return categoryMapper.selectList(null).stream()
                .sorted(Comparator.comparing(BookCategory::getId).reversed())
                .map(this::toVo)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryVO detail(Long id) {
        return toVo(findCategory(id));
    }

    @Override
    @Transactional
    public void create(CategorySaveRequest request) {
        ensureUnique(request.getCategoryName(), null);
        BookCategory category = new BookCategory();
        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());
        categoryMapper.insert(category);
    }

    @Override
    @Transactional
    public void update(CategorySaveRequest request) {
        BookCategory category = findCategory(request.getId());
        ensureUnique(request.getCategoryName(), request.getId());
        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());
        categoryMapper.updateById(category);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        findCategory(id);
        long bookCount = bookMapper.selectCount(new LambdaQueryWrapper<Book>().eq(Book::getCategoryId, id));
        if (bookCount > 0) {
            throw new BizException("该分类下还有图书，不能删除");
        }
        categoryMapper.deleteById(id);
    }

    private BookCategory findCategory(Long id) {
        BookCategory category = categoryMapper.selectById(id);
        if (category == null) {
            throw new NotFoundException("分类不存在");
        }
        return category;
    }

    private void ensureUnique(String name, Long ignoreId) {
        long count = categoryMapper.selectCount(new LambdaQueryWrapper<BookCategory>()
                .eq(BookCategory::getCategoryName, name)
                .ne(ignoreId != null, BookCategory::getId, ignoreId));
        if (count > 0) {
            throw new BizException("分类名称已存在");
        }
    }

    private CategoryVO toVo(BookCategory category) {
        CategoryVO vo = new CategoryVO();
        BeanUtils.copyProperties(category, vo);
        return vo;
    }

    private boolean containsIgnoreCase(String source, String keyword) {
        return source != null && source.toLowerCase().contains(keyword.toLowerCase());
    }
}
