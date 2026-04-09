package com.comprapro.controller;

import com.comprapro.entity.Cliente;
import com.comprapro.repository.ClienteRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    @Autowired
    private ClienteRepository clienteRepo;

    @GetMapping
    public List<Cliente> listar() {
        return clienteRepo.findByActivoTrueOrderByNombreAsc();
    }

    @GetMapping("/buscar")
    public List<Cliente> buscar(@RequestParam String q) {
        return clienteRepo.buscar(q);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cliente> obtener(@PathVariable Long id) {
        return clienteRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody Cliente cliente) {
        try {
            cliente.setActivo(true);
            return ResponseEntity.ok(clienteRepo.save(cliente));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error al crear cliente: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody Cliente datos) {
        return clienteRepo.findById(id)
                .map(c -> {
                    c.setNombre(datos.getNombre());
                    c.setEmail(datos.getEmail());
                    c.setTelefono(datos.getTelefono());
                    c.setDireccion(datos.getDireccion());
                    c.setDocumento(datos.getDocumento());
                    return ResponseEntity.ok(clienteRepo.save(c));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return clienteRepo.findById(id)
                .map(c -> {
                    c.setActivo(false);
                    clienteRepo.save(c);
                    return ResponseEntity.ok(Map.of("mensaje", "Cliente eliminado correctamente"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
