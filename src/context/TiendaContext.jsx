import { createContext, useContext, useState } from 'react';
import { supabase } from '../lib/supabase';

const TiendaContext = createContext();

export function TiendaProvider({ children }) {
  const [carrito, setCarrito] = useState([]);
  const [isCarritoOpen, setIsCarritoOpen] = useState(false);
  const [comprando, setComprando] = useState(false);

  const agregarAlCarrito = (producto) => {
    setCarrito((prev) => {
      const existe = prev.find((item) => item.id === producto.id);
      if (existe) {
        return prev.map((item) =>
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
    setIsCarritoOpen(true);
  };

  const removerDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  const actualizarCantidad = (id, cantidad) => {
    if (cantidad < 1) return;
    setCarrito((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cantidad } : item))
    );
  };

  const totalCarrito = carrito.reduce(
    (total, item) => total + item.precio * item.cantidad,
    0
  );

  const totalItems = carrito.reduce(
    (total, item) => total + item.cantidad,
    0
  );

  const realizarCompra = async (user) => {
    if (carrito.length === 0) return { success: false, error: 'Carrito vacío' };
    if (!user) return { success: false, requireAuth: true };
    
    setComprando(true);
    try {
      const productosOrden = carrito.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        subtotal: item.precio * item.cantidad
      }));

      const orden = {
        cliente_id: user.id,
        cliente_nombre: user.user_metadata?.full_name || user.email,
        cliente_email: user.email,
        productos: productosOrden,
        total: totalCarrito,
        items: totalItems,
        estado: 'Pendiente',
        fecha: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('ordenes')
        .insert([orden])
        .select()
        .single();

      if (error) throw error;

      // Descontar stock de cada producto de manera segura consultando la BD
      for (const item of carrito) {
        const { data: prodData } = await supabase
          .from('productos')
          .select('stock')
          .eq('id', item.id)
          .single();
          
        if (prodData) {
          await supabase
            .from('productos')
            .update({ stock: Math.max(0, prodData.stock - item.cantidad) })
            .eq('id', item.id);
        }
      }

      // Vaciar carrito
      const copiaCarrito = [...carrito];
      setCarrito([]);
      setIsCarritoOpen(false);
      
      return { success: true, orden: data, items: copiaCarrito };
    } catch (error) {
      console.error('Error al realizar compra:', error);
      return { success: false, error: error.message };
    } finally {
      setComprando(false);
    }
  };

  return (
    <TiendaContext.Provider
      value={{
        carrito,
        isCarritoOpen,
        setIsCarritoOpen,
        agregarAlCarrito,
        removerDelCarrito,
        actualizarCantidad,
        totalCarrito,
        totalItems,
        realizarCompra,
        comprando,
      }}
    >
      {children}
    </TiendaContext.Provider>
  );
}

export function useTienda() {
  return useContext(TiendaContext);
}
