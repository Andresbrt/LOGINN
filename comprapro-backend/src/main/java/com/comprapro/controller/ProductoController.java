package com.comprapro.controller;

import com.comprapro.entity.Producto;
import com.comprapro.repository.ProductoRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepo;

    @GetMapping
    public List<Producto> listar() {
        return productoRepo.findByActivoTrueOrderByNombreAsc();
    }

    @GetMapping("/buscar")
    public List<Producto> buscar(@RequestParam String q) {
        return productoRepo.buscar(q);
    }

    @GetMapping("/stock-bajo")
    public List<Producto> stockBajo(@RequestParam(defaultValue = "10") int limite) {
        return productoRepo.findByActivoTrueAndStockLessThanEqual(limite);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Producto> obtener(@PathVariable Long id) {
        return productoRepo.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody Producto producto) {
        try {
            producto.setActivo(true);
            return ResponseEntity.ok(productoRepo.save(producto));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error al crear producto: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizar(@PathVariable Long id, @Valid @RequestBody Producto datos) {
        return productoRepo.findById(id)
                .map(p -> {
                    p.setNombre(datos.getNombre());
                    p.setDescripcion(datos.getDescripcion());
                    p.setPrecio(datos.getPrecio());
                    p.setStock(datos.getStock());
                    p.setCategoria(datos.getCategoria());
                    p.setCodigo(datos.getCodigo());
                    return ResponseEntity.ok(productoRepo.save(p));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return productoRepo.findById(id)
                .map(p -> {
                    p.setActivo(false);
                    productoRepo.save(p);
                    return ResponseEntity.ok(Map.of("mensaje", "Producto eliminado correctamente"));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
