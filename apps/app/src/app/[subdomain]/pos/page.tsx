"use client";

import { useState } from "react";
import { Card } from "@/shared/components/Card";
import { Button } from "@/shared/components/Button";
import { Input } from "@/shared/components/Input";

export default function POS() {
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Producto A", price: 29.99, quantity: 2, total: 59.98 },
    { id: 2, name: "Producto B", price: 49.99, quantity: 1, total: 49.99 }
  ]);
  const [searchTerm, setSearchTerm] = useState("");

  const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;

  const mockProducts = [
    { id: 3, name: "Producto C", price: 15.99, stock: 25 },
    { id: 4, name: "Producto D", price: 89.99, stock: 8 },
    { id: 5, name: "Producto E", price: 34.99, stock: 15 }
  ];

  const addToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1, total: product.price }]);
    }
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity === 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id 
          ? { ...item, quantity, total: quantity * item.price }
          : item
      ));
    }
  };

  const processSale = () => {
    // TODO: Implement actual sale processing
    alert(`Venta procesada: $${total.toFixed(2)}`);
    setCartItems([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Punto de Venta</h1>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
      </header>

      <main className="flex h-[calc(100vh-73px)]">
        {/* Left side - Products */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="mb-6">
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-lg"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...mockProducts, ...cartItems].map((product) => (
              <Card 
                key={product.id} 
                className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => addToCart(product)}
              >
                <div className="text-center">
                  <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-lg mx-auto mb-3 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-white mb-1">{product.name}</h3>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">${product.price.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Stock: {product.stock || '∞'}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right side - Cart */}
        <div className="w-96 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Carrito</h2>
            
            {cartItems.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-400">Carrito vacío</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-slate-900 dark:text-white">{item.name}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">${item.price.toFixed(2)} c/u</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-medium text-slate-900 dark:text-white">${item.total.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200 dark:border-slate-600 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                    <span className="font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">IVA (16%)</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-slate-900 dark:text-white">Total</span>
                    <span className="text-blue-600 dark:text-blue-400">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <Input placeholder="Cliente (opcional)" />
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" onClick={() => setCartItems([])}>
                      Limpiar
                    </Button>
                    <Button onClick={processSale} className="bg-green-600 hover:bg-green-700">
                      Cobrar
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}