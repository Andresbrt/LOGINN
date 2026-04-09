package com.comprapro.dto;

import com.comprapro.entity.DetalleCompra;
import com.comprapro.entity.EncabezadoCompra;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class CompraResponse {
    private Long id;
    private String numeroCompra;
    private Long clienteId;
    private String clienteNombre;
    private BigDecimal subtotal;
    private BigDecimal impuesto;
    private BigDecimal total;
    private String estado;
    private String observaciones;
    private LocalDateTime fechaCompra;
    private List<DetalleResponse> detalles;

    @Data
    public static class DetalleResponse {
        private Long id;
        private Long productoId;
        private String productoNombre;
        private int cantidad;
        private BigDecimal precioUnitario;
        private BigDecimal subtotal;
    }

    public static CompraResponse from(EncabezadoCompra enc) {
        CompraResponse r = new CompraResponse();
        r.setId(enc.getId());
        r.setNumeroCompra(enc.getNumeroCompra());
        r.setClienteId(enc.getCliente().getId());
        r.setClienteNombre(enc.getCliente().getNombre());
        r.setSubtotal(enc.getSubtotal());
        r.setImpuesto(enc.getImpuesto());
        r.setTotal(enc.getTotal());
        r.setEstado(enc.getEstado());
        r.setObservaciones(enc.getObservaciones());
        r.setFechaCompra(enc.getFechaCompra());
        if (enc.getDetalles() != null) {
            r.setDetalles(enc.getDetalles().stream().map(d -> {
                DetalleResponse dr = new DetalleResponse();
                dr.setId(d.getId());
                dr.setProductoId(d.getProducto().getId());
                dr.setProductoNombre(d.getProducto().getNombre());
                dr.setCantidad(d.getCantidad());
                dr.setPrecioUnitario(d.getPrecioUnitario());
                dr.setSubtotal(d.getSubtotal());
                return dr;
            }).collect(Collectors.toList()));
        }
        return r;
    }
}
