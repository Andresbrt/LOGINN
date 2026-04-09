package com.comprapro.controller;

import com.comprapro.dto.CompraRequest;
import com.comprapro.dto.CompraResponse;
import com.comprapro.service.CompraService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/compras")
@CrossOrigin(origins = "*")
public class CompraController {

    @Autowired
    private CompraService compraService;

    @PostMapping
    public ResponseEntity<?> realizarCompra(@RequestBody CompraRequest request,
                                             Authentication auth) {
        try {
            String username = auth != null ? auth.getName() : null;
            CompraResponse response = compraService.realizarCompra(request, username);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public List<CompraResponse> listar() {
        return compraService.listarCompras();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> obtener(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(compraService.obtenerCompra(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
