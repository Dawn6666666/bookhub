package org.example.bookhub.service;

import org.example.bookhub.common.PageResponse;
import org.example.bookhub.dto.request.CategorySaveRequest;
import org.example.bookhub.dto.response.CategoryVO;

import java.util.List;

public interface CategoryService {

    PageResponse<CategoryVO> pageCategories(Integer page, Integer size, String keyword);

    List<CategoryVO> listAll();

    CategoryVO detail(Long id);

    void create(CategorySaveRequest request);

    void update(CategorySaveRequest request);

    void delete(Long id);
}
