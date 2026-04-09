package com.comprapro.repository;

import com.comprapro.entity.Cliente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {
    List<Cliente> findByActivoTrue();
    List<Cliente> findByActivoTrueOrderByNombreAsc();

    @Query("SELECT c FROM Cliente c WHERE c.activo = true AND " +
           "(LOWER(c.nombre) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.documento) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Cliente> buscar(@Param("q") String q);

    long countByActivoTrue();
}
