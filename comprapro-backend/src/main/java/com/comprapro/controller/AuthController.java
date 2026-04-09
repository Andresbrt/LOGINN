package com.comprapro.controller;

import com.comprapro.dto.LoginRequest;
import com.comprapro.dto.LoginResponse;
import com.comprapro.repository.UsuarioRepository;
import com.comprapro.security.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthenticationManager authManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UsuarioRepository usuarioRepo;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            String token = jwtUtils.generateToken(request.getUsername());

            return usuarioRepo.findByUsername(request.getUsername())
                    .map(user -> ResponseEntity.ok(new LoginResponse(
                            token,
                            user.getUsername(),
                            user.getNombre(),
                            user.getRol(),
                            user.getId()
                    )))
                    .orElse(ResponseEntity.notFound().build());

        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Credenciales inválidas. Verifica tu usuario y contraseña."));
        } catch (DisabledException e) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Tu cuenta está deshabilitada. Contacta al administrador."));
        }
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String bearerToken) {
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            if (jwtUtils.validateToken(token)) {
                String username = jwtUtils.getUsernameFromToken(token);
                return usuarioRepo.findByUsername(username)
                        .map(u -> ResponseEntity.ok(Map.of(
                                "valid", true,
                                "username", u.getUsername(),
                                "nombre", u.getNombre(),
                                "rol", u.getRol()
                        )))
                        .orElse(ResponseEntity.status(401).build());
            }
        }
        return ResponseEntity.status(401).body(Map.of("valid", false));
    }
}
