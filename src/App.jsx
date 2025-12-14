import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, TrendingUp, TrendingDown, BarChart3, Search, Plus, Minus, Trash2, Camera, X, Check, AlertTriangle, Save, Download, Upload, RefreshCw, Loader } from 'lucide-react';
import { getProducts, getProductByCode, addProduct as apiAddProduct, adjustStock, updateStock, createBill, getBills, updateProduct } from './api/sheets';
import BarcodeInput from './components/BarcodeInput';

const App = () => {
  const [activeTab, setActiveTab] = useState('billing');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [notification, setNotification] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [customer, setCustomer] = useState({ name: '', phone: '' });
  
  // Loading and Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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

  const [editingProductCode, setEditingProductCode] = useState(null);
  const [editingProduct, setEditingProduct] = useState({});

  const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Mall Billing & Stock Management';
  const SHEETS_API = import.meta.env.VITE_SHEETS_API || '';
  const [testingSheets, setTestingSheets] = useState(false);

  // Load data from Google Sheets ONLY
  const loadData = async () => {
    setLoading(true);
    setError(null);

    // Check if API is configured
    if (!SHEETS_API) {
      setError('Google Sheets API not configured. Please set VITE_SHEETS_API environment variable.');
      setLoading(false);
      return;
    }

    try {
      // Load Products from Google Sheets
      const apiProducts = await getProducts();
      
      if (apiProducts && Array.isArray(apiProducts)) {
        setProducts(apiProducts);
        showNotification(`Loaded ${apiProducts.length} products from Google Sheets`, 'success');
      } else {
        throw new Error('Invalid response from Google Sheets');
      }

      // Load Bills from Google Sheets
      try {
        const apiBills = await getBills();
        if (apiBills && Array.isArray(apiBills)) {
          setBills(apiBills);
        }
      } catch (billError) {
        console.warn('Could not load bills:', billError);
      }

    } catch (err) {
      console.error('Failed to load data:', err);
      setError(`Failed to load data from Google Sheets: ${err.message}`);
      showNotification('Failed to connect to Google Sheets', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Check for low stock
  useEffect(() => {
    const low = products.filter(p => p.stock <= p.minStock && p.stock > 0);
    setLowStockItems(low);
  }, [products]);

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Refresh data from Google Sheets
  const refreshData = async () => {
    await loadData();
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

  const completeBill = async () => {
    if (cart.length === 0) {
      showNotification('Cart is empty!', 'error');
      return;
    }
    if (!customer.name || !customer.phone) {
      showNotification('Enter customer name and phone before billing', 'error');
      return;
    }

    const bill = {
      id: `BILL${Date.now()}`,
      date: new Date().toLocaleString(),
      items: [...cart],
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      customer
    };

    try {
      await createBill(bill);
      
      // Reload products from Google Sheets to get updated stock
      const updated = await getProducts();
      if (updated && Array.isArray(updated)) {
        setProducts(updated);
      }
      
      // Reload bills
      const updatedBills = await getBills();
      if (updatedBills && Array.isArray(updatedBills)) {
        setBills(updatedBills);
      } else {
        setBills([bill, ...bills]);
      }
      
      setCart([]);
      setCustomer({ name: '', phone: '' });
      showNotification('Bill completed successfully!', 'success');
    } catch (e) {
      showNotification(`Failed to save bill: ${e.message}`, 'error');
    }
  };

  // Stock management
  const handleStockOperation = async (e) => {
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

    try {
      const change = stockForm.type === 'in' ? qty : -qty;
      await adjustStock(stockForm.productCode, change);

      // Reload products from Google Sheets
      const updated = await getProducts();
      if (updated && Array.isArray(updated)) {
        setProducts(updated);
      }

      showNotification(`Stock ${stockForm.type === 'in' ? 'added' : 'removed'} successfully!`, 'success');
      setStockForm({ productCode: '', quantity: '', type: 'in', reason: '' });
    } catch (err) {
      showNotification(`Failed to update stock: ${err.message}`, 'error');
    }
  };

  // Product management
  const addProduct = async (e) => {
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

    try {
      await apiAddProduct(product);
      
      // Reload products from Google Sheets
      const updated = await getProducts();
      if (updated && Array.isArray(updated)) {
        setProducts(updated);
      }
      
      showNotification('Product added successfully!', 'success');
      setNewProduct({ code: '', name: '', category: '', price: '', stock: '', minStock: '' });
    } catch (e) {
      showNotification(`Failed to add product: ${e.message}`, 'error');
    }
  };

  const startEditProduct = (product) => {
    setEditingProductCode(product.code);
    setEditingProduct({ ...product });
  };

  const cancelEditProduct = () => {
    setEditingProductCode(null);
    setEditingProduct({});
  };

  const saveEditProduct = async (e) => {
    e.preventDefault();
    if (!editingProductCode) return;
    
    const payload = {
      name: editingProduct.name,
      category: editingProduct.category,
      price: parseFloat(editingProduct.price),
      stock: parseInt(editingProduct.stock),
      minStock: parseInt(editingProduct.minStock)
    };
    
    try {
      await updateProduct(editingProductCode, payload);
      
      // Reload products from Google Sheets
      const updated = await getProducts();
      if (updated && Array.isArray(updated)) {
        setProducts(updated);
      }
      
      cancelEditProduct();
      showNotification('Product updated successfully!', 'success');
    } catch (e) {
      showNotification(`Failed to update product: ${e.message}`, 'error');
    }
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
  const totalProducts = products.length;
  const todaySales = bills.filter(b => 
    new Date(b.date).toDateString() === new Date().toDateString()
  ).reduce((sum, b) => sum + (b.total || 0), 0);

  // ==================== LOADING STATE ====================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Loading from Google Sheets...</h2>
          <p className="text-gray-500 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={refreshData}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Retry Connection
            </button>
            
            <div className="text-left bg-gray-50 rounded-lg p-4 text-sm">
              <p className="font-semibold mb-2">Checklist:</p>
              <ul className="space-y-1 text-gray-600">
                <li>✓ Set <code className="bg-gray-200 px-1 rounded">VITE_SHEETS_API</code> in Vercel</li>
                <li>✓ Deploy Google Apps Script as Web App</li>
                <li>✓ Set access to "Anyone"</li>
                <li>✓ Redeploy after adding env variable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==================== MAIN APP ====================
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{APP_TITLE}</h1>
            <p className="text-blue-100 text-sm">Connected to Google Sheets</p>
          </div>
          <button
            onClick={refreshData}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg flex items-center gap-2 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
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
          <div className="flex space-x-1 p-2 overflow-x-auto">
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
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
        
        {/* Empty State - No Products */}
        {products.length === 0 && activeTab !== 'products' && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h2>
            <p className="text-gray-500 mb-4">Add products in Google Sheets or use the Products tab</p>
            <button
              onClick={() => setActiveTab('products')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Products
            </button>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && products.length > 0 && (
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
                  Scan
                </button>
              </div>

              {showScanner && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-500 mb-1">Scan/Enter product code</label>
                  <BarcodeInput onScan={async (code) => {
                    try {
                      const remote = await getProductByCode(code);
                      if (remote && remote.code) {
                        addToCart(remote);
                      } else {
                        const found = products.find(p => p.code === code || p.name === code);
                        if (found) addToCart(found);
                        else showNotification('Product not found', 'error');
                      }
                    } catch (e) {
                      showNotification('Failed to fetch product', 'error');
                    }
                  }} />
                </div>
              )}

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
                Cart ({cart.length})
              </h2>

              <div className="mb-3">
                <label className="block text-xs text-gray-500">Customer Name *</label>
                <input 
                  value={customer.name} 
                  onChange={(e) => setCustomer({...customer, name: e.target.value})} 
                  className="w-full px-3 py-2 border rounded mt-1" 
                  placeholder="Customer name" 
                />
                <label className="block text-xs text-gray-500 mt-2">Phone *</label>
                <input 
                  value={customer.phone} 
                  onChange={(e) => setCustomer({...customer, phone: e.target.value})} 
                  className="w-full px-3 py-2 border rounded mt-1" 
                  placeholder="Phone number" 
                />
              </div>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Cart is empty</p>
              ) : (
                <>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto mb-4">
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
                <label className="block text-sm font-medium mb-2">Product Code</label>
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
                <label className="block text-sm font-medium mb-2">Product Code</label>
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
                  placeholder="e.g., Damaged, Expired"
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
                  Add Product to Google Sheets
                </button>
              </form>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Products ({products.length})</h2>
                <button
                  onClick={refreshData}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
              
              {products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No products in Google Sheets</p>
                  <p className="text-sm">Add products using the form or directly in the sheet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {products.map(product => (
                    <div key={product.code} className="border rounded-lg p-3 hover:shadow-md transition">
                      {editingProductCode === product.code ? (
                        <form onSubmit={saveEditProduct} className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              value={editingProduct.name} 
                              onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} 
                              className="px-2 py-1 border rounded" 
                              placeholder="Name"
                            />
                            <input 
                              value={editingProduct.category} 
                              onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})} 
                              className="px-2 py-1 border rounded" 
                              placeholder="Category"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <input 
                              type="number" 
                              value={editingProduct.price} 
                              onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} 
                              className="px-2 py-1 border rounded" 
                              placeholder="Price"
                            />
                            <input 
                              type="number" 
                              value={editingProduct.stock} 
                              onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})} 
                              className="px-2 py-1 border rounded" 
                              placeholder="Stock"
                            />
                            <input 
                              type="number" 
                              value={editingProduct.minStock} 
                              onChange={(e) => setEditingProduct({...editingProduct, minStock: e.target.value})} 
                              className="px-2 py-1 border rounded" 
                              placeholder="Min"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button type="submit" className="px-3 py-1 bg-green-600 text-white rounded text-sm">Save</button>
                            <button type="button" onClick={cancelEditProduct} className="px-3 py-1 bg-gray-200 rounded text-sm">Cancel</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">{product.name}</h3>
                              <p className="text-sm text-gray-500">{product.code} • {product.category}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-blue-600">₹{product.price}</span>
                              <button 
                                onClick={() => startEditProduct(product)} 
                                className="px-2 py-1 bg-yellow-100 hover:bg-yellow-200 rounded text-sm"
                              >
                                Edit
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className={`text-sm font-medium ${
                              product.stock <= product.minStock ? 'text-red-600' : 'text-green-600'
                            }`}>
                              Stock: {product.stock} (Min: {product.minStock})
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Products</p>
                    <p className="text-2xl font-bold">{totalProducts}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Stock</p>
                    <p className="text-2xl font-bold">{totalStock}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Today's Sales</p>
                    <p className="text-2xl font-bold">₹{todaySales}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Bills</p>
                    <p className="text-2xl font-bold">{bills.length}</p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Recent Bills */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Recent Bills</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={refreshData}
                    className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1"
                  >
                    <RefreshCw className="w-4 h-4"/> Refresh
                  </button>
                  <button 
                    onClick={() => {
                      if (!bills.length) return;
                      const csv = ['ID,Date,Customer,Phone,Total,Items', 
                        ...bills.map(b => [
                          b.id, 
                          b.date, 
                          b.customer?.name || '', 
                          b.customer?.phone || '',
                          b.total, 
                          (b.items || []).map(i => `${i.code}(${i.quantity})`).join(';')
                        ].map(c => `"${c}"`).join(','))
                      ].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = 'bills.csv'; a.click();
                      URL.revokeObjectURL(url);
                    }} 
                    className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200 flex items-center gap-1"
                  >
                    <Download className="w-4 h-4"/> Export
                  </button>
                </div>
              </div>

              {bills.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bills yet</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {bills.map(b => (
                    <div key={b.id} className="border rounded p-3 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{b.id}</div>
                        <div className="text-sm text-gray-500">{b.date}</div>
                        {b.customer && (
                          <div className="text-xs text-gray-400">{b.customer.name} • {b.customer.phone}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">₹{b.total}</div>
                        <div className="text-xs text-gray-500">{(b.items || []).length} items</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Alert */}
            {lowStockItems.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-4">
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Low Stock Items
                </h3>
                <div className="space-y-2">
                  {lowStockItems.map(item => (
                    <div key={item.code} className="flex justify-between items-center border p-3 rounded">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          Code: {item.code} • Stock: {item.stock} (Min: {item.minStock})
                        </div>
                      </div>
                      <button 
                        onClick={() => { 
                          setActiveTab('stockIn'); 
                          setStockForm({ ...stockForm, productCode: item.code, quantity: '', type: 'in' }); 
                        }} 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Restock
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;