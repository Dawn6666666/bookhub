package org.example.bookhub.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("book_category")
public class BookCategory extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String categoryName;
    private String description;
}
