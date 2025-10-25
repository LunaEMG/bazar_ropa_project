-- Insertar proveedores
INSERT INTO proveedor (nombre, telefono) VALUES
('Proveedor de Telas del Centro', '5512345678'),
('Calzado Fino S.A.', '5587654321');

-- Insertar clientes
INSERT INTO cliente (nombre, telefono) VALUES
('Ana Gómez', '5511112222'),
('Luis Pérez', '5533334444');

-- Insertar direcciones
-- Asegúrate de que los id_cliente coincidan con los insertados arriba (1 para Ana, 2 para Luis)
INSERT INTO direccion (calle, ciudad, codigo_postal, id_cliente) VALUES
('Calle Falsa 123', 'Ciudad de México', '06000', 1),
('Avenida Siempre Viva 742', 'Puebla', '72000', 2);

-- Insertar productos (Superclase)
-- Toma nota de los IDs que se generarán (probablemente 1, 2, 3 si la tabla estaba vacía)
INSERT INTO producto (nombre, descripcion, precio, cantidad_stock, id_proveedor) VALUES
('Camisa de Lino', 'Camisa fresca de lino para verano', 499.90, 50, 1),
('Zapatos de Piel', 'Zapatos de vestir color negro', 1299.90, 30, 2),
('Bufanda de Lana', 'Bufanda tejida color gris', 249.50, 100, 1);

-- Insertar en tablas de subtipos
-- IMPORTANTE: Usa los IDs correctos generados en el paso anterior
INSERT INTO ropa (id_producto, material, tipo_corte, talla) VALUES
(1, 'Lino', 'Slim Fit', 'M'); -- Asumiendo que 'Camisa de Lino' obtuvo ID 1

INSERT INTO calzado (id_producto, talla_numerica, material_suela) VALUES
(2, 27.5, 'Goma'); -- Asumiendo que 'Zapatos de Piel' obtuvo ID 2

INSERT INTO accesorios (id_producto, material, dimensiones) VALUES
(3, 'Lana', '180cm x 30cm'); -- Asumiendo que 'Bufanda de Lana' obtuvo ID 3