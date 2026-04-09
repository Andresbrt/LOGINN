package com.comprapro.repository;

import com.comprapro.entity.EncabezadoCompra;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface EncabezadoCompraRepository extends JpaRepository<EncabezadoCompra, Long> {
    List<EncabezadoCompra> findAllByOrderByFechaCompraDesc();

    @Query("SELECT e FROM EncabezadoCompra e WHERE e.fechaCompra >= :inicio AND e.fechaCompra < :fin ORDER BY e.fechaCompra DESC")
    List<EncabezadoCompra> findByFechaCompraBetween(LocalDateTime inicio, LocalDateTime fin);

    long countByFechaCompraBetween(LocalDateTime inicio, LocalDateTime fin);

    @Query("SELECT COALESCE(SUM(e.total), 0) FROM EncabezadoCompra e WHERE e.fechaCompra >= :inicio AND e.fechaCompra < :fin")
    java.math.BigDecimal sumTotalByFechaCompraBetween(LocalDateTime inicio, LocalDateTime fin);
}
