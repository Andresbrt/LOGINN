package com.comprapro.service;

import com.comprapro.dto.CompraRequest;
import com.comprapro.dto.CompraResponse;
import com.comprapro.entity.*;
import com.comprapro.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CompraService {

    @Autowired
    private EncabezadoCompraRepository encabezadoRepo;

    @Autowired
    private DetalleCompraRepository detalleRepo;

    @Autowired
    private ClienteRepository clienteRepo;

    @Autowired
    private ProductoRepository productoRepo;

    @Autowired
    private UsuarioRepository usuarioRepo;

    private static final BigDecimal IVA = new BigDecimal("0.12");

    @Transactional
    public CompraResponse realizarCompra(CompraRequest request, String username) {
        Cliente cliente = clienteRepo.findById(request.getClienteId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado: " + request.getClienteId()));

        EncabezadoCompra encabezado = new EncabezadoCompra();
        encabezado.setCliente(cliente);
        encabezado.setNumeroCompra(generarNumeroCompra());
        encabezado.setObservaciones(request.getObservaciones());
        encabezado.setFechaCompra(LocalDateTime.now());
        encabezado.setEstado("COMPLETADA");

        // Obtener usuario si existe
        if (username != null) {
            usuarioRepo.findByUsername(username).ifPresent(encabezado::setUsuario);
        }

        encabezado = encabezadoRepo.save(encabezado);

        BigDecimal subtotal = BigDecimal.ZERO;

        for (CompraRequest.DetalleRequest det : request.getDetalles()) {
            Producto producto = productoRepo.findById(det.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + det.getProductoId()));

            if (producto.getStock() < det.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para: " + producto.getNombre() +
                        " (disponible: " + producto.getStock() + ", solicitado: " + det.getCantidad() + ")");
            }

            DetalleCompra detalle = new DetalleCompra();
            detalle.setEncabezado(encabezado);
            detalle.setProducto(producto);
            detalle.setCantidad(det.getCantidad());
            detalle.setPrecioUnitario(producto.getPrecio());
            BigDecimal subDet = producto.getPrecio().multiply(BigDecimal.valueOf(det.getCantidad()));
            detalle.setSubtotal(subDet);
            detalleRepo.save(detalle);

            // Descontar stock
            producto.setStock(producto.getStock() - det.getCantidad());
            productoRepo.save(producto);

            subtotal = subtotal.add(subDet);
        }

        BigDecimal impuesto = subtotal.multiply(IVA).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(impuesto).setScale(2, RoundingMode.HALF_UP);

        encabezado.setSubtotal(subtotal.setScale(2, RoundingMode.HALF_UP));
        encabezado.setImpuesto(impuesto);
        encabezado.setTotal(total);
        encabezado = encabezadoRepo.save(encabezado);

        // Recargar con detalles
        EncabezadoCompra final_ = encabezadoRepo.findById(encabezado.getId()).orElse(encabezado);
        return CompraResponse.from(final_);
    }

    public List<CompraResponse> listarCompras() {
        return encabezadoRepo.findAllByOrderByFechaCompraDesc()
                .stream()
                .map(CompraResponse::from)
                .collect(Collectors.toList());
    }

    public CompraResponse obtenerCompra(Long id) {
        EncabezadoCompra enc = encabezadoRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Compra no encontrada: " + id));
        return CompraResponse.from(enc);
    }

    private String generarNumeroCompra() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        long count = encabezadoRepo.count() + 1;
        return String.format("CP-%s-%04d", timestamp, count);
    }
}
