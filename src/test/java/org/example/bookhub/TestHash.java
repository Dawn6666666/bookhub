package org.example.bookhub;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class TestHash {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        System.out.println("TEST HASH FOR 123456: " + encoder.encode("123456"));
    }
}