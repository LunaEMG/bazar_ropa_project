from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, Date, Numeric
from sqlalchemy.orm import relationship, declarative_base
from datetime import date

Base = declarative_base()

class Cliente(Base):
    __tablename__ = "cliente"

    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    rol = Column(String, default="cliente")
    esta_activo = Column(Boolean, default=True)

    direcciones = relationship("Direccion", back_populates="cliente")
    ventas = relationship("Venta", back_populates="cliente")

class Direccion(Base):
    __tablename__ = "direccion"

    id_direccion = Column(Integer, primary_key=True, index=True)
    calle = Column(String, nullable=False)
    ciudad = Column(String, nullable=False)
    codigo_postal = Column(String, nullable=False)
    id_cliente = Column(Integer, ForeignKey("cliente.id_cliente"), nullable=False)

    cliente = relationship("Cliente", back_populates="direcciones")

class Proveedor(Base):
    __tablename__ = "proveedor"

    id_proveedor = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=True)
    esta_activo = Column(Boolean, default=True)

    productos = relationship("Producto", back_populates="proveedor")

class Producto(Base):
    __tablename__ = "producto"

    id_producto = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    precio = Column(Numeric(10, 2), nullable=False)
    cantidad_stock = Column(Integer, nullable=False)
    imagen_url = Column(String, nullable=True) # New column
    id_proveedor = Column(Integer, ForeignKey("proveedor.id_proveedor"), nullable=False)
    esta_activo = Column(Boolean, default=True)

    proveedor = relationship("Proveedor", back_populates="productos")
    
    # DetalleVenta relationship
    detalle_ventas = relationship("DetalleVenta", back_populates="producto")

    # Relationship to subtypes (One-to-One)
    ropa_detalle = relationship("Ropa", uselist=False, back_populates="producto")
    calzado_detalle = relationship("Calzado", uselist=False, back_populates="producto")
    accesorios_detalle = relationship("Accesorios", uselist=False, back_populates="producto")

class Ropa(Base):
    __tablename__ = "ropa"
    
    id_producto = Column(Integer, ForeignKey("producto.id_producto"), primary_key=True)
    material = Column(String)
    tipo_corte = Column(String)
    talla = Column(String)

    producto = relationship("Producto", back_populates="ropa_detalle")

class Calzado(Base):
    __tablename__ = "calzado"

    id_producto = Column(Integer, ForeignKey("producto.id_producto"), primary_key=True)
    talla_numerica = Column(Float) 
    material_suela = Column(String)

    producto = relationship("Producto", back_populates="calzado_detalle")

class Accesorios(Base):
    __tablename__ = "accesorios"

    id_producto = Column(Integer, ForeignKey("producto.id_producto"), primary_key=True)
    material = Column(String)
    dimensiones = Column(String)

    producto = relationship("Producto", back_populates="accesorios_detalle")

class Venta(Base):
    __tablename__ = "venta"

    id_venta = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("cliente.id_cliente"), nullable=False)
    fecha = Column(Date, default=date.today)
    monto_total = Column(Numeric(10, 2), nullable=False)

    cliente = relationship("Cliente", back_populates="ventas")
    detalles = relationship("DetalleVenta", back_populates="venta", cascade="all, delete-orphan")

class DetalleVenta(Base):
    __tablename__ = "detalle_venta"

    id_venta = Column(Integer, ForeignKey("venta.id_venta"), primary_key=True)
    id_producto = Column(Integer, ForeignKey("producto.id_producto"), primary_key=True)
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalle_ventas")
