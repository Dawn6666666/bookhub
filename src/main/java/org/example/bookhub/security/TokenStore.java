package org.example.bookhub.security;

import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class TokenStore {

    private final Map<String, AuthPrincipal> tokens = new ConcurrentHashMap<>();

    public String issue(AuthPrincipal principal) {
        String token = UUID.randomUUID().toString().replace("-", "");
        tokens.put(token, principal);
        return token;
    }

    public Optional<AuthPrincipal> get(String token) {
        return Optional.ofNullable(tokens.get(token));
    }

    public void remove(String token) {
        tokens.remove(token);
    }
}
