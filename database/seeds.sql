--=================================================================
--  BORRADO Y REINICIO DE TABLAS
--=================================================================
-- Esto limpia las tablas en el orden correcto y reinicia los contadores
TRUNCATE proveedor,
cliente,
producto,
venta RESTART IDENTITY CASCADE;
--=================================================================
--  PROVEEDORES (Sin IDs explícitos, el contador sube solo)
--=================================================================
INSERT INTO proveedor (nombre, telefono)
VALUES ('Proveedor de Telas del Centro', '5512345678'),
    ('Calzado Fino S.A.', '5587654321'),
    ('Accesorios de Lujo GDL', '3398765432');
--=================================================================
--  CLIENTES (Sin IDs explícitos)
--=================================================================
-- Contraseñas Hasheadas (bcrypt):
INSERT INTO cliente (
        nombre,
        telefono,
        email,
        hashed_password,
        rol,
        esta_activo
    )
VALUES (
        'Ana Gómez (Admin)',
        '5511112222',
        'admin@bazar.com',
        '$2b$12$Eix2s2tG.i8nU1yP.S.E9eS/nUoigqea/W1NqjVbU3sKbUcbqnH.S',
        'admin',
        TRUE
    ),
    (
        'Luis Pérez (Usuario)',
        '5533334444',
        'luis@bazar.com',
        '$2b$12$D4.9.FWc.f.m/m1O18.C9eE.J8.Fw.Gg.QGq.pL.yP.i8.N7.z5C',
        'usuario',
        TRUE
    ),
    (
        'Carlos Mendoza',
        '5544556677',
        'carlos@bazar.com',
        '$2b$12$D4.9.FWc.f.m/m1O18.C9eE.J8.Fw.Gg.QGq.pL.yP.i8.N7.z5C',
        'usuario',
        TRUE
    ),
    (
        'Elena Torres',
        '8112345678',
        'elena@bazar.com',
        '$2b$12$D4.9.FWc.f.m/m1O18.C9eE.J8.Fw.Gg.QGq.pL.yP.i8.N7.z5C',
        'usuario',
        TRUE
    );
--=================================================================
--  DIRECCIONES (Sin IDs explícitos)
--=================================================================
INSERT INTO direccion (calle, ciudad, codigo_postal, id_cliente)
VALUES (
        'Calle Falsa 123',
        'Ciudad de México',
        '06000',
        1
    ),
    ('Avenida Siempre Viva 742', 'Puebla', '72000', 2),
    (
        'Insurgentes Sur 100',
        'Ciudad de México',
        '03020',
        1
    ),
    ('Av. Gonzalitos 500', 'Monterrey', '64000', 4);
--=================================================================
--  PRODUCTOS (¡CON IDs EXPLÍCITOS! Causa del problema)
--=================================================================
INSERT INTO producto (
        id_producto,
        nombre,
        descripcion,
        precio,
        cantidad_stock,
        imagen_url,
        id_proveedor
    )
VALUES (
        1,
        'Camisa de Lino',
        'Camisa fresca de lino para verano',
        499.90,
        50,
        'https://placehold.co/400x400?text=Camisa+Lino',
        1
    ),
    (
        2,
        'Zapatos de Piel',
        'Zapatos de vestir color negro',
        1299.90,
        30,
        'https://placehold.co/400x400?text=Zapatos+Piel',
        2
    ),
    (
        3,
        'Bufanda de Lana',
        'Bufanda tejida color gris',
        249.50,
        100,
        'https://placehold.co/400x400?text=Bufanda',
        1
    ),
    (
        4,
        'Pantalón de Mezclilla',
        'Pantalón corte recto',
        799.00,
        40,
        'https://placehold.co/400x400?text=Pantalon',
        1
    ),
    (
        5,
        'Botas de Piel',
        'Botas casuales color café',
        1599.00,
        25,
        'https://placehold.co/400x400?text=Botas',
        2
    ),
    (
        6,
        'Cinturón de Piel',
        'Cinturón reversible negro/café',
        349.90,
        80,
        'https://placehold.co/400x400?text=Cinturon',
        3
    );
--=================================================================
--  PRODUCTOS (SUBTIPOS)
--=================================================================
INSERT INTO ropa (id_producto, material, tipo_corte, talla)
VALUES (1, 'Lino', 'Slim Fit', 'M'),
    (4, 'Mezclilla', 'Recto', '32');
INSERT INTO calzado (id_producto, talla_numerica, material_suela)
VALUES (2, 27.5, 'Goma'),
    (5, 28.0, 'Sintética');
INSERT INTO accesorios (id_producto, material, dimensiones)
VALUES (3, 'Lana', '180cm x 30cm'),
    (6, 'Piel', '110cm');
--=================================================================
--  VENTAS (IDs explícitos)
--=================================================================
INSERT INTO venta (id_venta, id_cliente, fecha, monto_total)
VALUES (1, 1, '2025-10-25', 998.90),
    (2, 2, '2025-10-26', 1299.90),
    (3, 1, '2025-11-01', 1148.90);
--=================================================================
--  DETALLE DE VENTAS
--=================================================================
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
VALUES (1, 1, 1, 499.90),
    (1, 3, 2, 249.50);
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
VALUES (2, 2, 1, 1299.90);
INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
VALUES (3, 4, 1, 799.00),
    (3, 6, 1, 349.90);
--=================================================================
--  REINICIO DE SECUENCIAS (LA SOLUCIÓN)
--=================================================================
-- Esto actualiza los contadores para que el siguiente ID sea MAX + 1
SELECT setval(
        pg_get_serial_sequence('producto', 'id_producto'),
        (
            SELECT MAX(id_producto)
            FROM producto
        )
    );
SELECT setval(
        pg_get_serial_sequence('venta', 'id_venta'),
        (
            SELECT MAX(id_venta)
            FROM venta
        )
    );
-- Reiniciamos también los demás por seguridad, aunque no tengan IDs explícitos
SELECT setval(
        pg_get_serial_sequence('proveedor', 'id_proveedor'),
        (
            SELECT MAX(id_proveedor)
            FROM proveedor
        )
    );
SELECT setval(
        pg_get_serial_sequence('cliente', 'id_cliente'),
        (
            SELECT MAX(id_cliente)
            FROM cliente
        )
    );
SELECT setval(
        pg_get_serial_sequence('direccion', 'id_direccion'),
        (
            SELECT MAX(id_direccion)
            FROM direccion
        )
    );