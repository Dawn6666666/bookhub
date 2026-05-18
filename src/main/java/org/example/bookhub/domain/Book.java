package org.example.bookhub.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("book")
public class Book extends BaseEntity {

    @TableId(type = IdType.AUTO)
    private Long id;
    private String bookName;
    private String author;
    private String publisher;
    private Long categoryId;
    private Integer totalCount;
    private Integer availableCount;
    private Integer status;
}
