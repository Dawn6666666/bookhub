package org.example.bookhub.common;

import lombok.Data;

import java.util.List;

@Data
public class PageResponse<T> {

    private long total;
    private int page;
    private int size;
    private List<T> records;

    public static <T> PageResponse<T> of(List<T> allRecords, int page, int size) {
        PageResponse<T> response = new PageResponse<>();
        int safePage = Math.max(page, 1);
        int safeSize = Math.max(size, 1);
        int fromIndex = Math.min((safePage - 1) * safeSize, allRecords.size());
        int toIndex = Math.min(fromIndex + safeSize, allRecords.size());
        response.total = allRecords.size();
        response.page = safePage;
        response.size = safeSize;
        response.records = allRecords.subList(fromIndex, toIndex);
        return response;
    }
}
