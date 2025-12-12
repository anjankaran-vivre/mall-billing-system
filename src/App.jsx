import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, TrendingUp, TrendingDown, BarChart3, Search, Plus, Minus, Trash2, Camera, X, Check, AlertTriangle, Save, Download, Upload } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('billing');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [notification, setNotification] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  
  // Form states
  const [newProduct, setNewProduct] = useState({
    code: '',
    name: '',
    category: '',
    price: '',
    stock: '',
    minStock: ''
  });
  
  const [stockForm, setStockForm] = useState({
    productCode: '',
    quantity: '',
    type: 'in',
    reason: ''
  });

  // Load demo data on mount
  useEffect(() => {
    loadDemoData();
  }, []);

  // Check for low stock
  useEffect(() => {
    const low = products.filter(p => p.stock <= p.minStock && p.stock > 0);
    setLowStockItems(low);
  }, [products]);

  const loadDemoData = () => {
    const demoProducts = [
      { code: 'P001', name: 'Rice 1kg', category: 'Grocery', price: 50, stock: 100, minStock: 20 },
      { code: 'P002', name: 'Cooking Oil 1L', category: 'Grocery', price: 120, stock: 50, minStock: 15 },
      { code: 'P003', name: 'Sugar 1kg', category: 'Grocery', price: 45, stock: 80, minStock: 20 },
      { code: 'P004', name: 'Tea Powder 250g', category: 'Beverage', price: 180, stock: 30, minStock: 10 },
      { code: 'P005', name: 'Wheat Flour 1kg', category: 'Grocery', price: 40, stock: 15, minStock: 25 },
      { code: 'P006', name: 'Detergent 1kg', category: 'Household', price: 150, stock: 40, minStock: 10 },
      { code: 'P007', name: 'Shampoo 200ml', category: 'Personal Care', price: 200, stock: 25, minStock: 10 },
      { code: 'P008', name: 'Toothpaste', category: 'Personal Care', price: 50, stock: 60, minStock: 15 },
    ];
    setProducts(demoProducts);
    showNotification('Demo data loaded successfully!', 'success');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Billing functions
  const addToCart = (product) => {
    if (product.stock <= 0) {
      showNotification('Product out of stock!', 'error');
      return;
    }
    
    const existing = cart.find(item => item.code === product.code);
    if (existing) {
      if (existing.quantity >= product.stock) {
        showNotification('Not enough stock!', 'error');
        return;
      }
      setCart(cart.map(item =>
        item.code === product.code
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showNotification(`${product.name} added to cart`, 'success');
  };

  const updateCartQuantity = (code, change) => {
    const product = products.find(p => p.code === code);
    setCart(cart.map(item => {
      if (item.code === code) {
        const newQty = item.quantity + change;
        if (newQty <= 0) return null;
        if (newQty > product.stock) {
          showNotification('Not enough stock!', 'error');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (code) => {
    setCart(cart.filter(item => item.code !== code));
  };

  const completeBill = () => {
    if (cart.length === 0) {
      showNotification('Cart is empty!', 'error');
      return;
    }

    const bill = {
      id: `BILL${Date.now()}`,
      date: new Date().toLocaleString(),
      items: [...cart],
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    };

    // Update stock
    const updatedProducts = products.map(product => {
      const cartItem = cart.find(item => item.code === product.code);
      if (cartItem) {
        return { ...product, stock: product.stock - cartItem.quantity };
      }
      return product;
    });

    setProducts(updatedProducts);
    setBills([bill, ...bills]);
    setCart([]);
    showNotification('Bill completed successfully!', 'success');
    
    // In real app, save to Google Sheets here
  };

  // Stock management
  const handleStockOperation = (e) => {
    e.preventDefault();
    const product = products.find(p => p.code === stockForm.productCode);
    
    if (!product) {
      showNotification('Product not found!', 'error');
      return;
    }

    const qty = parseInt(stockForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      showNotification('Invalid quantity!', 'error');
      return;
    }

    const updatedProducts = products.map(p => {
      if (p.code === stockForm.productCode) {
        const newStock = stockForm.type === 'in' 
          ? p.stock + qty 
          : Math.max(0, p.stock - qty);
        return { ...p, stock: newStock };
      }
      return p;
    });

    setProducts(updatedProducts);
    showNotification(`Stock ${stockForm.type === 'in' ? 'added' : 'removed'} successfully!`, 'success');
    setStockForm({ productCode: '', quantity: '', type: 'in', reason: '' });
  };

  // Product management
  const addProduct = (e) => {
    e.preventDefault();
    
    if (products.find(p => p.code === newProduct.code)) {
      showNotification('Product code already exists!', 'error');
      return;
    }

    const product = {
      code: newProduct.code,
      name: newProduct.name,
      category: newProduct.category,
      price: parseFloat(newProduct.price),
      stock: parseInt(newProduct.stock),
      minStock: parseInt(newProduct.minStock)
    };

    setProducts([...products, product]);
    showNotification('Product added successfully!', 'success');
    setNewProduct({ code: '', name: '', category: '', price: '', stock: '', minStock: '' });
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalProducts = products.length;
  const todaySales = bills.filter(b => 
    new Date(b.date).toDateString() === new Date().toDateString()
  ).reduce((sum, b) => sum + b.total, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Mall Billing & Stock Management</h1>
          <p className="text-blue-100 text-sm">QR Code Based System</p>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' :
          notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
        } text-white flex items-center gap-2`}>
          <Check className="w-5 h-5" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 max-w-7xl mx-auto mt-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              <strong>Low Stock Alert:</strong> {lowStockItems.length} items need restocking
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-1 p-2">
            {[
              { id: 'billing', label: 'Billing', icon: ShoppingCart },
              { id: 'stockIn', label: 'Stock In', icon: TrendingUp },
              { id: 'stockOut', label: 'Stock Out', icon: TrendingDown },
              { id: 'products', label: 'Products', icon: Package },
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Products List */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => setShowScanner(!showScanner)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Scan QR
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto">
                {filteredProducts.map(product => (
                  <div
                    key={product.code}
                    className={`border rounded-lg p-3 hover:shadow-md transition cursor-pointer ${
                      product.stock <= 0 ? 'opacity-50 bg-gray-50' : ''
                    }`}
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.code}</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                      <span className={`text-sm font-medium ${
                        product.stock <= product.minStock ? 'text-red-600' : 'text-green-600'
                      }`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                Cart
              </h2>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                    {cart.map(item => (
                      <div key={item.code} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-gray-500">₹{item.price} each</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.code)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateCartQuantity(item.code, -1)}
                              className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(item.code, 1)}
                              className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="font-bold">₹{item.price * item.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold">Total:</span>
                      <span className="text-2xl font-bold text-blue-600">₹{cartTotal}</span>
                    </div>
                    <button
                      onClick={completeBill}
                      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Complete Bill
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stock In Tab */}
        {activeTab === 'stockIn' && (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-green-600" />
              Add Stock (Stock In)
            </h2>
            <form onSubmit={handleStockOperation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Code / Name</label>
                <input
                  type="text"
                  value={stockForm.productCode}
                  onChange={(e) => setStockForm({...stockForm, productCode: e.target.value, type: 'in'})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter product code"
                  required
                  list="product-codes"
                />
                <datalist id="product-codes">
                  {products.map(p => (
                    <option key={p.code} value={p.code}>{p.name}</option>
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity to Add</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Enter quantity"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason / Notes</label>
                <input
                  type="text"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({...stockForm, reason: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., New purchase, Return from customer"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-5 h-5" />
                Add Stock
              </button>
            </form>
          </div>
        )}

        {/* Stock Out Tab */}
        {activeTab === 'stockOut' && (
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingDown className="w-7 h-7 text-red-600" />
              Remove Stock (Stock Out)
            </h2>
            <form onSubmit={handleStockOperation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Product Code / Name</label>
                <input
                  type="text"
                  value={stockForm.productCode}
                  onChange={(e) => setStockForm({...stockForm, productCode: e.target.value, type: 'out'})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Enter product code"
                  required
                  list="product-codes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Quantity to Remove</label>
                <input
                  type="number"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Enter quantity"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Reason</label>
                <input
                  type="text"
                  value={stockForm.reason}
                  onChange={(e) => setStockForm({...stockForm, reason: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="e.g., Damaged, Expired, Returned to supplier"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold flex items-center justify-center gap-2"
              >
                <TrendingDown className="w-5 h-5" />
                Remove Stock
              </button>
            </form>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add Product Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Plus className="w-7 h-7 text-blue-600" />
                Add New Product
              </h2>
              <form onSubmit={addProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Code</label>
                  <input
                    type="text"
                    value={newProduct.code}
                    onChange={(e) => setNewProduct({...newProduct, code: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., P009"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Coffee 100g"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Beverage"
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Price (₹)</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Stock</label>
                    <input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Stock</label>
                    <input
                      type="number"
                      value={newProduct.minStock}
                      onChange={(e) => setNewProduct({...newProduct, minStock: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      required
                      min="0"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              </form>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">All Products ({products.length})</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {products.map(product => (
                  <div key={product.code} className="border rounded-lg p-3 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-gray-500">{product.code} - {product.category}</p>
                      </div>
                      <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className={`text-sm font-medium ${
                        product.stock <= product.minStock ? 'text-red-600' : 'text-green-600'
                      }`}>
                        Stock: {product.stock} (Min: {product.minStock})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className