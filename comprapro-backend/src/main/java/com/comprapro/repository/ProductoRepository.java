package com.comprapro.repository;

import com.comprapro.entity.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProductoRepository extends JpaRepository<Producto, Long> {
    List<Producto> findByActivoTrue();
    List<Producto> findByActivoTrueOrderByNombreAsc();

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND " +
           "(LOWER(p.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.codigo) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.categoria) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Producto> buscar(@Param("q") String q);

    List<Producto> findByActivoTrueAndStockLessThanEqual(int stock);

    long countByActivoTrue();
}
