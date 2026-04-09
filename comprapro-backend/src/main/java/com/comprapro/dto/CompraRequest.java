package com.comprapro.dto;

import lombok.Data;

import java.util.List;

@Data
public class CompraRequest {
    private Long clienteId;
    private String observaciones;
    private List<DetalleRequest> detalles;

    @Data
    public static class DetalleRequest {
        private Long productoId;
        private int cantidad;
    }
}
