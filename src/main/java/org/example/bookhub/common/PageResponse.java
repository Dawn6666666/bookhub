package org.example.bookhub.common;

import java.util.List;

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

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public List<T> getRecords() {
        return records;
    }

    public void setRecords(List<T> records) {
        this.records = records;
    }
}
