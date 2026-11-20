import React, { useState } from "react";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Trash2, 
  Check, 
  ShoppingCart, 
  Lock, 
  Tag, 
  Building2, 
  Truck, 
  Scale, 
  CheckCircle,
  CreditCard
} from "lucide-react";
import { SparePart, CartItem } from "../types";

interface SparesStoreProps {
  spares: SparePart[];
  cart: CartItem[];
  onAddToCart: (part: SparePart, quantity: number) => void;
  onUpdateCartQty: (skuId: string, quantity: number) => void;
  onRemoveFromCart: (skuId: string) => void;
  onCheckout: () => Promise<void>;
  isCartOpen: boolean;
  onCloseCart: () => void;
  markupPercent?: number;
}

export default function SparesStore({
  spares,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onCheckout,
  isCartOpen,
  onCloseCart,
  markupPercent = 0
}: SparesStoreProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [purchased, setPurchased] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const categories = ["All", "Sensors & Probes", "Batteries", "Filters & Tubings", "Cables", "Imaging Parts"];

  const filteredSpares = spares.filter((part) => {
    const matchesSearch = 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.compatibleEquipment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || part.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getAdjustedPrice = (price: number) => price * (1 + markupPercent / 100);

  const cartSubtotal = cart.reduce((sum, item) => sum + getAdjustedPrice(item.product.price) * item.quantity, 0);
  const healthTax = cartSubtotal * 0.05; // 5% standard BME portal medical excise tax
  const shipping = cartSubtotal > 500 ? 0 : 35; // Free shipping on large BME portal orders over $500
  const grandTotal = cartSubtotal + healthTax + shipping;

  const handleProcessOrder = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    try {
      // Simulate BME portal authorization delays
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await onCheckout();
      setPurchased(true);
      setTimeout(() => {
        setPurchased(false);
        onCloseCart();
      }, 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-8 relative">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-sans text-white tracking-tight">
            Spares & Consumables Store
          </h2>
          <p className="text-xs text-slate-400">
            Browse certified hospital facility replacement parts, probes, cells, and high-performance cabling.
          </p>
        </div>
      </div>

      {/* Categories Chips & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search spare parts, compatibility, or SKU..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest hidden md:block">
            BME portal Contract Prorated Prices
          </div>
        </div>

        {/* Categories row */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 subtle-scrollbar">
          <Filter className="h-4.5 w-4.5 text-slate-500 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all ${
                activeCategory === cat
                  ? "bg-indigo-600 text-white border border-indigo-500/30 shadow-md shadow-indigo-600/15"
                  : "bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* E-Commerce Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredSpares.map((part) => {
          const itemInCart = cart.find((i) => i.id === part.id);
          const quantityInCart = itemInCart ? itemInCart.quantity : 0;

          return (
            <div 
              key={part.id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between group hover:border-slate-700 transition"
            >
              {/* Image & Category overlay */}
              <div className="relative h-44 overflow-hidden bg-slate-950">
                <img
                  src={part.image}
                  alt={part.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-slate-950/90 text-indigo-400 border border-slate-850 font-mono text-[9px] font-bold uppercase py-0.5 px-2 rounded-md">
                  {part.category}
                </span>

                {/* Stock alert overlay */}
                {part.stock <= 5 && (
                  <span className="absolute bottom-3 right-3 bg-rose-950/90 text-rose-300 border border-rose-900 font-mono text-[9px] font-semibold py-0.5 px-1.5 rounded-md">
                    Low Stock: {part.stock}
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-mono block">SKU: {part.sku}</span>
                  <h4 className="font-bold text-white text-sm line-clamp-2 h-10 group-hover:text-indigo-400 transition" title={part.name}>
                    {part.name}
                  </h4>
                  <div className="text-[10px] text-slate-400/90 italic bg-slate-950/40 p-1.5 rounded border border-slate-850/50 mt-1.5">
                    Compatibility: {part.compatibleEquipment}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-mono leading-none">Net Unit Cost</span>
                    <p className="text-lg font-mono font-extrabold text-white leading-none">${getAdjustedPrice(part.price).toFixed(2)}</p>
                  </div>
                  
                  {/* Rating / Quality */}
                  <div className="text-right flex items-center space-x-1 justify-end">
                    <span className="text-xs font-bold text-amber-400 font-mono">★</span>
                    <span className="text-[10px] text-slate-350 font-semibold font-mono">{part.rating}</span>
                  </div>
                </div>
              </div>

              {/* Action area */}
              <div className="p-4 pt-0">
                {part.stock > 0 ? (
                  quantityInCart > 0 ? (
                    <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-950 border border-slate-850 p-1">
                      <button
                        onClick={() => onUpdateCartQty(part.id, quantityInCart - 1)}
                        className="py-1 flex items-center justify-center font-bold text-xs text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        -
                      </button>
                      <span className="py-1 flex items-center justify-center text-xs font-bold font-mono text-white">
                        {quantityInCart}
                      </span>
                      <button
                        onClick={() => onUpdateCartQty(part.id, quantityInCart + 1)}
                        disabled={quantityInCart >= part.stock}
                        className="py-1 disabled:opacity-30 flex items-center justify-center font-bold text-xs text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddToCart(part, 1)}
                      className="w-full bg-slate-950 hover:bg-indigo-600 hover:text-white border border-slate-850 hover:border-indigo-550 text-slate-200 py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      <span>Add to Hospital Order</span>
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="w-full bg-slate-950 border border-slate-900 text-slate-500 py-2 rounded-xl text-xs font-semibold cursor-not-allowed"
                  >
                    Backordered / Out of Stock
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart Drawer Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl relative">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-indigo-950/20">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="h-5 w-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Hospital Procurement Order</h3>
              </div>
              <button
                onClick={onCloseCart}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Cart Contents */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 subtle-scrollbar">
              {purchased ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-6">
                  <div className="bg-emerald-500/10 p-5 rounded-full border border-emerald-900/40 text-emerald-400 animate-bounce">
                    <CheckCircle className="h-12 w-12" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Order Approved & Dispatched</h4>
                    <span className="text-[10px] font-mono text-emerald-500 block uppercase mt-1">ORDER SMR-4091A</span>
                    <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto">
                      Biomedical spares successfully logged into Firestore inventory. Parts tracking details dispatched to facility supervisor.
                    </p>
                  </div>
                </div>
              ) : cart.length > 0 ? (
                cart.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-start space-x-3 justify-between group"
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-slate-900">
                        <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover opacity-80" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-bold text-slate-200 text-xs truncate" title={item.product.name}>{item.product.name}</h5>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">SKU: {item.product.sku}</p>
                        
                        {/* Cost calculation */}
                        <div className="text-xs text-slate-450 font-mono font-medium mt-1">
                          {item.quantity} × <span className="text-slate-350">${getAdjustedPrice(item.product.price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between self-stretch text-xs">
                      <button 
                        onClick={() => onRemoveFromCart(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-md hover:bg-rose-950/20 transition cursor-pointer"
                        title="Remove segment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Qty controller inside cart */}
                      <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 scale-90 origin-bottom-right">
                        <button 
                          onClick={() => onUpdateCartQty(item.id, item.quantity - 1)}
                          className="font-bold text-slate-400 hover:text-white"
                        >
                          -
                        </button>
                        <span className="font-bold font-mono text-white text-[11px] px-1">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateCartQty(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="font-bold text-slate-400 hover:text-white disabled:opacity-20"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 p-6 text-slate-500">
                  <div className="bg-slate-950 p-4 rounded-full text-slate-600">
                    <ShoppingCart className="h-8 w-8" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-400 text-sm">Procurement Order Cart is Empty</h5>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Select medical spare parts and consumables from our catalogue to populate your order.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Checkout Summary Footer */}
            {cart.length > 0 && !purchased && (
              <div className="p-5 border-t border-slate-800 bg-slate-950/80 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Corporate Parts Subtotal:</span>
                    <span className="font-mono font-medium text-slate-200">${cartSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Medical Excise Surtax (5%):</span>
                    <span className="font-mono font-medium text-slate-200">${healthTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Freight Clinical Shipping:</span>
                    <span className="font-mono font-medium text-slate-200">
                      {shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-slate-900 flex justify-between font-bold text-sm text-white">
                    <span>Hospital Est. Total:</span>
                    <span className="font-mono text-indigo-400">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-1.5 space-y-2">
                  <button
                    onClick={handleProcessOrder}
                    disabled={checkoutLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25 cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>{checkoutLoading ? "Authorizing Hospital Lines..." : "Approve & Submit Procurement"}</span>
                  </button>

                  <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 font-mono">
                    <Lock className="h-3 w-3 text-indigo-500" />
                    <span>SECURE DIRECT-CHECKOUT TO FIRESTORE</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
