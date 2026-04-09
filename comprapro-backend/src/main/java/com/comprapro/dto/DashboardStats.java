package com.comprapro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStats {
    private long totalClientes;
    private long totalProductos;
    private long comprasHoy;
    private BigDecimal ventasHoy;
    private long productosStockBajo;
}
