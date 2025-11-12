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
--  CLIENTES (¡ACTUALIZADO CON ROLES Y CONTRASEÑAS!)
--=================================================================
-- Contraseñas Hasheadas (bcrypt):
-- 'admin123' = $2b$12$Eix2s2tG.i8nU1yP.S.E9eS/nUoigqea/W1NqjVbU3sKbUcbqnH.S
-- 'user123'  = $2b$12$D4.9.FWc.f.m/m1O18.C9eE.J8.Fw.Gg.QGq.pL.yP.i8.N7.z5C

-- ID 1: Administrador (Ana Gómez)
-- Login: admin@bazar.com / admin123
INSERT INTO cliente (nombre, telefono, email, hashed_password, rol, esta_activo) VALUES
('Ana Gómez (Admin)', '5511112222', 'admin@bazar.com', '$2b$12$Eix2s2tG.i8nU1yP.S.E9eS/nUoigqea/W1NqjVbU3sKbUcbqnH.S', 'admin', TRUE);

-- ID 2: Usuario (Luis Pérez)
-- Login: luis@bazar.com / user123
INSERT INTO cliente (nombre, telefono, email, hashed_password, rol, esta_activo) VALUES
('Luis Pérez (Usuario)', '5533334444', 'luis@bazar.com', '$2b$12$D4.9.FWc.f.m/m1O18.C9eE.J8.Fw.Gg.QGq.pL.yP.i8.N7.z5C', 'usuario', TRUE);

-- ID 3: Usuario (Carlos Mendoza)
-- Login: carlos@bazar.com / user123
INSERT INTO cliente (nombre, telefono, email, hashed_password, rol, esta_activo) VALUES
('Carlos Mendoza', '5544556677', 'carlos@bazar.com', '$2b$12$D4.9.FWc.f.m/m1O18.C9eE.J8.Fw.Gg.QGq.pL.yP.i8.N7.z5C', 'usuario', TRUE);

-- ID 4: Usuario (Elena Torres)
-- Login: elena@bazar.com / user123
INSERT INTO cliente (nombre, telefono, email, hashed_password, rol, esta_activo) VALUES
('Elena Torres', '8112345678', 'elena@bazar.com', '$2b$12$D4.9.FWc.f.m/m1O18.C9eE.J8.Fw.Gg.QGq.pL.yP.i8.N7.z5C', 'usuario', TRUE);


--=================================================================
--  DIRECCIONES
--=================================================================
-- IDs de cliente: 1=Ana(Admin), 2=Luis(Usuario), 4=Elena(Usuario)
INSERT INTO direccion (calle, ciudad, codigo_postal, id_cliente) VALUES
('Calle Falsa 123', 'Ciudad de México', '06000', 1), -- Dirección de Ana (Admin)
('Avenida Siempre Viva 742', 'Puebla', '72000', 2),  -- Dirección de Luis (Usuario)
('Insurgentes Sur 100', 'Ciudad de México', '03020', 1), -- Segunda dirección de Ana (Admin)
('Av. Gonzalitos 500', 'Monterrey', '64000', 4);     -- Dirección de Elena (Usuario)


--=================================================================
--  PRODUCTOS (SUPERCLASE)
--=================================================================
-- (Sin cambios, esto está perfecto)
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
-- (Sin cambios)
INSERT INTO ropa (id_producto, material, tipo_corte, talla) VALUES
(1, 'Lino', 'Slim Fit', 'M'),
(4, 'Mezclilla', 'Recto', '32');

INSERT INTO calzado (id_producto, talla_numerica, material_suela) VALUES
(2, 27.5, 'Goma'),
(5, 28.0, 'Sintética');

INSERT INTO accesorios (id_producto, material, dimensiones) VALUES
(3, 'Lana', '180cm x 30cm'),
(6, 'Piel', '110cm');


--=================================================================
--  VENTAS
--=================================================================
-- (Sin cambios, ahora están asociadas a los usuarios que sí pueden loguearse)
-- Venta 1: Ana (Admin, Cliente 1) compra
INSERT INTO venta (id_venta, id_cliente, fecha, monto_total) VALUES
(1, 1, '2025-10-25', 998.90);

-- Venta 2: Luis (Usuario, Cliente 2) compra
INSERT INTO venta (id_venta, id_cliente, fecha, monto_total) VALUES
(2, 2, '2025-10-26', 1299.90);

-- Venta 3: Ana (Admin, Cliente 1) compra de nuevo
INSERT INTO venta (id_venta, id_cliente, fecha, monto_total) VALUES
(3, 1, '2025-11-01', 1148.90);


--=================================================================
--  DETALLE DE VENTAS
--=================================================================
-- (Sin cambios)
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
(1, 1, 1, 499.90), -- 1 Camisa de Lino
(1, 3, 2, 249.50); -- 2 Bufandas de Lana

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
(2, 2, 1, 1299.90); -- 1 Zapatos de Piel

INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES
(3, 4, 1, 799.00), -- 1 Pantalón
(3, 6, 1, 349.90); -- 1 Cinturón

-- (Asegura que los contadores de IDs se reinicien correctamente)
SELECT setval(pg_get_serial_sequence('venta', 'id_venta'), (SELECT MAX(id_venta) FROM venta));