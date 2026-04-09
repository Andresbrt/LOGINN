package com.comprapro.controller;

import com.comprapro.dto.DashboardStats;
import com.comprapro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
public class DashboardController {

    @Autowired private ClienteRepository clienteRepo;
    @Autowired private ProductoRepository productoRepo;
    @Autowired private EncabezadoCompraRepository compraRepo;

    @GetMapping("/stats")
    public DashboardStats getStats() {
        LocalDateTime inicioHoy = LocalDate.now().atStartOfDay();
        LocalDateTime finHoy = inicioHoy.plusDays(1);

        long totalClientes = clienteRepo.countByActivoTrue();
        long totalProductos = productoRepo.countByActivoTrue();
        long comprasHoy = compraRepo.countByFechaCompraBetween(inicioHoy, finHoy);
        BigDecimal ventasHoy = compraRepo.sumTotalByFechaCompraBetween(inicioHoy, finHoy);
        long stockBajo = productoRepo.findByActivoTrueAndStockLessThanEqual(10).size();

        return new DashboardStats(totalClientes, totalProductos, comprasHoy,
                ventasHoy != null ? ventasHoy : BigDecimal.ZERO, stockBajo);
    }
}
