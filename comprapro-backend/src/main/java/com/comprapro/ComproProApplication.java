package com.comprapro;

import com.comprapro.entity.Cliente;
import com.comprapro.entity.Producto;
import com.comprapro.entity.Usuario;
import com.comprapro.repository.ClienteRepository;
import com.comprapro.repository.ProductoRepository;
import com.comprapro.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;

@SpringBootApplication
public class ComproProApplication {

    public static void main(String[] args) {
        SpringApplication.run(ComproProApplication.class, args);
    }

    @Bean
    CommandLineRunner initData(
            UsuarioRepository usuarioRepo,
            ClienteRepository clienteRepo,
            ProductoRepository productoRepo,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // Crear usuario admin
            if (usuarioRepo.findByUsername("admin").isEmpty()) {
                Usuario admin = new Usuario();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("123456"));
                admin.setNombre("Administrador");
                admin.setEmail("admin@comprapro.com");
                admin.setRol("ADMIN");
                usuarioRepo.save(admin);
            }
            if (usuarioRepo.findByUsername("vendedor").isEmpty()) {
                Usuario vendedor = new Usuario();
                vendedor.setUsername("vendedor");
                vendedor.setPassword(passwordEncoder.encode("123456"));
                vendedor.setNombre("Juan Vendedor");
                vendedor.setEmail("vendedor@comprapro.com");
                vendedor.setRol("VENDEDOR");
                usuarioRepo.save(vendedor);
            }

            // Crear clientes demo
            if (clienteRepo.count() == 0) {
                clienteRepo.save(crearCliente("María García", "maria.garcia@email.com", "555-0101", "Av. Principal 123", "12345678A"));
                clienteRepo.save(crearCliente("Carlos López", "carlos.lopez@email.com", "555-0102", "Calle Secundaria 456", "87654321B"));
                clienteRepo.save(crearCliente("Ana Martínez", "ana.martinez@email.com", "555-0103", "Plaza Central 789", "11223344C"));
                clienteRepo.save(crearCliente("Roberto Silva", "roberto.silva@email.com", "555-0104", "Blvd. Norte 321", "44332211D"));
                clienteRepo.save(crearCliente("Laura Pérez", "laura.perez@email.com", "555-0105", "Col. Sur 654", "55667788E"));
            }

            // Crear productos demo
            if (productoRepo.count() == 0) {
                productoRepo.save(crearProducto("Laptop Dell XPS 15", "Laptop profesional 15.6\" Intel i7", new BigDecimal("1299.99"), 15, "Electrónicos", "LAP-001"));
                productoRepo.save(crearProducto("Mouse Inalámbrico Logitech", "Mouse ergonómico inalámbrico", new BigDecimal("45.99"), 80, "Periféricos", "MOU-001"));
                productoRepo.save(crearProducto("Teclado Mecánico RGB", "Teclado mecánico switches Cherry MX", new BigDecimal("129.99"), 35, "Periféricos", "TEC-001"));
                productoRepo.save(crearProducto("Monitor 27\" 4K", "Monitor UHD IPS 144Hz", new BigDecimal("449.99"), 20, "Monitores", "MON-001"));
                productoRepo.save(crearProducto("Auriculares Sony WH-1000XM5", "Auriculares Bluetooth ANC premium", new BigDecimal("349.99"), 25, "Audio", "AUR-001"));
                productoRepo.save(crearProducto("Webcam Logitech C920", "Webcam Full HD 1080p", new BigDecimal("89.99"), 42, "Periféricos", "CAM-001"));
                productoRepo.save(crearProducto("SSD Samsung 1TB", "SSD NVMe M.2 PCIe 4.0", new BigDecimal("119.99"), 60, "Almacenamiento", "SSD-001"));
                productoRepo.save(crearProducto("RAM Kingston 16GB DDR5", "Memoria DDR5 5600MHz", new BigDecimal("79.99"), 55, "Memoria", "RAM-001"));
                productoRepo.save(crearProducto("Mouse Pad XL Gaming", "Tapete de escritorio 90x40cm", new BigDecimal("29.99"), 5, "Accesorios", "PAD-001"));
                productoRepo.save(crearProducto("Hub USB-C 7 en 1", "HUB multiporta USB-C HDMI", new BigDecimal("59.99"), 38, "Accesorios", "HUB-001"));
            }
        };
    }

    private Cliente crearCliente(String nombre, String email, String telefono, String direccion, String documento) {
        Cliente c = new Cliente();
        c.setNombre(nombre);
        c.setEmail(email);
        c.setTelefono(telefono);
        c.setDireccion(direccion);
        c.setDocumento(documento);
        c.setActivo(true);
        return c;
    }

    private Producto crearProducto(String nombre, String descripcion, BigDecimal precio, int stock, String categoria, String codigo) {
        Producto p = new Producto();
        p.setNombre(nombre);
        p.setDescripcion(descripcion);
        p.setPrecio(precio);
        p.setStock(stock);
        p.setCategoria(categoria);
        p.setCodigo(codigo);
        p.setActivo(true);
        return p;
    }
}
