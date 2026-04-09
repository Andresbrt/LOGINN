package com.comprapro.repository;

import com.comprapro.entity.DetalleCompra;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DetalleCompraRepository extends JpaRepository<DetalleCompra, Long> {
    List<DetalleCompra> findByEncabezadoId(Long encabezadoId);
}
