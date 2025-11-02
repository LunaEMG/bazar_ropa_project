--=================================================================
--  BORRADO Y REINICIO DE TABLAS
--=================================================================
-- Esto limpia las tablas en el orden correcto y reinicia los contadores (id_... = 1)
-- CASCADE se encarga de las dependencias (ej. borra 'detalle_venta' antes que 'venta')
TRUNCATE 
    proveedor, 
    cliente, 
    producto,
    venta
RESTART IDENTITY CASCADE;
-- (Nota: 'direccion', 'ropa', 'calzado', 'accesorios' y 'detalle_venta' se truncan 
--  automáticamente por 'CASCADE' al truncar a sus padres)


--=================================================================
--  PROVEEDORES
--=================================================================
INSERT INTO proveedor (nombre, telefono) VALUES
('Proveedor de Telas del Centro', '5512345678'),
('Calzado Fino S.A.', '5587654321'),
('Accesorios de Lujo GDL', '3398765432');


--=================================================================
--  CLIENTES
--=================================================================
INSERT INTO cliente (nombre, telefono) VALUES
('Ana Gómez', '5511112222'),
('Luis Pérez', '5533334444'),
('Carlos Mendoza', '5544556677'), -- Cliente para probar borrado (sin ventas)
('Elena Torres', '8112345678');


--=================================================================
--  DIRECCIONES
--=================================================================
-- IDs de cliente: 1=Ana, 2=Luis, 3=Carlos, 4=Elena
INSERT INTO direccion (calle, ciudad, codigo_postal, id_cliente) VALUES
('Calle Falsa 123', 'Ciudad de México', '06000', 1),
('Avenida Siempre Viva 742', 'Puebla', '72000', 2),
('Insurgentes Sur 100', 'Ciudad de México', '03020', 1), -- Segunda dirección de Ana
('Av. Gonzalitos 500', 'Monterrey', '64000', 4);     -- Dirección de Elena


--=================================================================
--  PRODUCTOS (SUPERCLASE)
--=================================================================
-- IDs de proveedor: 1=Telas, 2=Calzado, 3=Accesorios
INSERT INTO producto (id_producto, nombre, descripcion, precio, cantidad_stock, id_proveedor) VALUES
(1, 'Camisa de Lino', 'Camisa fresca de lino para verano', 499.90, 50, 1),
(2, 'Zapatos de Piel', 'Zapatos de vestir color negro', 1299.90, 30, 2),
(3, 'Bufanda de Lana', 'Bufanda tejida color gris', 249.50, 100, 1),
(4, 'Pantalón de Mezclilla', 'Pantalón corte recto', 799.00, 40, 1),
(5, 'Botas de Piel', 'Botas casuales color café', 1599.00, 25, 2),
(6, 'Cinturón de Piel', 'Cinturón reversible negro/café', 349.90, 80, 3);


--=================================================================
--  PRODUCTOS (SUBTIPOS)
--=================================================================
-- (Ropa)
INSERT INTO ropa (id_producto, material, tipo_corte, talla) VALUES
(1, 'Lino', 'Slim Fit', 'M'),
(4, 'Mezclilla', 'Recto', '32');

-- (Calzado)
INSERT INTO calzado (id_producto, talla_numerica, material_suela) VALUES
(2, 27.5, 'Goma'),
(5, 28.0, 'Sintética');

-- (Accesorios)
INSERT INTO accesorios (id_producto, material, dimensiones) VALUES
(3, 'Lana', '180cm x 30cm'),
(6, 'Piel', '110cm');


--=================================================================
--  VENTAS
--=================================================================
-- Venta 1: Ana (Cliente 1) compra 1 Camisa (499.90) y 2 Bufandas (249.50 c/u)
-- Total: 499.90 + (2 * 249.50) = 998.90
INSERT INTO venta (id_venta, id_cliente, fecha, monto_total) VALUES
(1, 1, '2025-10-25', 998.90);

-- Venta 2: Luis (Cliente 2) compra 1 Zapatos (1299.90)
-- Total: 1299.90
INSERT INTO venta (id_venta, id_cliente, fecha, monto_total) VALUES
(2, 2, '2025-10-26', 1299.90);

-- Venta 3: Ana (Cliente 1) compra 1 Pantalón (799.00) y 1 Cinturón (349.90)
-- Total: 799.00 + 349.90 = 1148.90
INSERT INTO venta (id_venta, id_cliente, fecha, monto_total) VALUES
(3, 1, '2025-11-01', 1148.90);


--=================================================================
--  DETALLE DE VENTAS
--=================================================================
-- (Venta 1)
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
(1, 1, 1, 499.90), -- 1 Camisa de Lino
(1, 3, 2, 249.50); -- 2 Bufandas de Lana

-- (Venta 2)
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
(2, 2, 1, 1299.90); -- 1 Zapatos de Piel

-- (Venta 3)
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
(3, 4, 1, 799.00), -- 1 Pantalón
(3, 6, 1, 349.90); -- 1 Cinturón