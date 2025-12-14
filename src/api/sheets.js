// src/api/sheets.js — OPTIMIZED FOR 10,000+ ROWS
const BASE = import.meta.env.VITE_SHEETS_API || '';

// IndexedDB wrapper for large datasets
class LocalDB {
  constructor() {
    this.db = null;
    this.ready = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('InventoryDB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        
        if (!db.objectStoreNames.contains('products')) {
          const store = db.createObjectStore('products', { keyPath: 'code' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('stock', 'stock', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('bills')) {
          db.createObjectStore('bills', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async saveProducts(products) {
    await this.ready;
    const tx = this.db.transaction(['products', 'metadata'], 'readwrite');
    const store = tx.objectStore('products');
    const meta = tx.objectStore('metadata');
    
    // Clear old data
    await store.clear();
    
    // Save all products
    for (const product of products) {
      await store.put(product);
    }
    
    // Save metadata
    await meta.put({ 
      key: 'products_last_sync', 
      timestamp: Date.now(),
      count: products.length 
    });
    
    return tx.complete;
  }

  async getProducts(filters = {}) {
    await this.ready;
    const tx = this.db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    
    let products = await store.getAll();
    
    // Apply filters
    if (filters.category) {
      products = products.filter(p => p.category === filters.category);
    }
    if (filters.lowStock) {
      products = products.filter(p => p.stock <= p.minStock);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      products = products.filter(p => 
        p.code.toLowerCase().includes(search) ||
        p.name.toLowerCase().includes(search)
      );
    }
    
    return products;
  }

  async getProduct(code) {
    await this.ready;
    const tx = this.db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    return await store.get(code);
  }

  async updateProduct(code, updates) {
    await this.ready;
    const tx = this.db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    
    const product = await store.get(code);
    if (product) {
      Object.assign(product, updates);
      await store.put(product);
    }
    
    return product;
  }

  async getLastSync() {
    await this.ready;
    const tx = this.db.transaction('metadata', 'readonly');
    const store = tx.objectStore('metadata');
    const meta = await store.get('products_last_sync');
    return meta?.timestamp || 0;
  }

  async saveBills(bills) {
    await this.ready;
    const tx = this.db.transaction('bills', 'readwrite');
    const store = tx.objectStore('bills');
    
    await store.clear();
    for (const bill of bills) {
      await store.put(bill);
    }
    
    return tx.complete;
  }

  async getBills() {
    await this.ready;
    const tx = this.db.transaction('bills', 'readonly');
    const store = tx.objectStore('bills');
    return await store.getAll();
  }
}

const localDB = new LocalDB();

// Sync status
let syncInProgress = false;
const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function fetchJSON(url, opts = {}) {
  if (!BASE) throw new Error('SHEETS_API_NOT_CONFIGURED');
  
  const fullUrl = `${BASE}${url}`;
  
  if (opts.method === 'POST') {
    const formData = new FormData();
    formData.append('data', opts.body);
    
    const res = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Error ${res.status}: ${text}`);
    }
    
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    
    return data;
  }
  
  const res = await fetch(fullUrl);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }
  
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  
  return data;
}

// Background sync
async function syncProducts() {
  if (syncInProgress) return;
  
  const lastSync = await localDB.getLastSync();
  const now = Date.now();
  
  // Only sync if more than SYNC_INTERVAL has passed
  if (now - lastSync < SYNC_INTERVAL) {
    console.log('Skipping sync, last sync was recent');
    return;
  }
  
  syncInProgress = true;
  console.log('Starting background sync...');
  
  try {
    const products = await fetchJSON('?action=products');
    await localDB.saveProducts(products);
    console.log(`Synced ${products.length} products`);
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    syncInProgress = false;
  }
}

// Start background sync on app load
if (typeof window !== 'undefined') {
  syncProducts(); // Initial sync
  setInterval(syncProducts, SYNC_INTERVAL); // Periodic sync
}

// API Methods
export async function getProducts(filters = {}, forceRefresh = false) {
  if (forceRefresh) {
    console.log('Force refresh: fetching from server...');
    const products = await fetchJSON('?action=products');
    await localDB.saveProducts(products);
    return products;
  }
  
  // Try IndexedDB first
  const lastSync = await localDB.getLastSync();
  if (lastSync > 0) {
    console.log('Loading from IndexedDB...');
    const products = await localDB.getProducts(filters);
    
    // Trigger background sync if data is old
    if (Date.now() - lastSync > SYNC_INTERVAL) {
      syncProducts();
    }
    
    return products;
  }
  
  // First time: fetch from server
  console.log('First load: fetching from server...');
  const products = await fetchJSON('?action=products');
  await localDB.saveProducts(products);
  return products;
}

export async function getProductByCode(code) {
  // Try IndexedDB first
  const product = await localDB.getProduct(code);
  if (product) {
    console.log('Loading product from IndexedDB');
    return product;
  }
  
  // Fallback to server
  return fetchJSON(`?action=product&code=${encodeURIComponent(code)}`);
}

export async function searchProducts(query) {
  return await localDB.getProducts({ search: query });
}

export async function getLowStockProducts() {
  return await localDB.getProducts({ lowStock: true });
}

export async function addProduct(product) {
  // Send to server
  const result = await fetchJSON('?action=product', {
    method: 'POST',
    body: JSON.stringify(product)
  });
  
  // Update IndexedDB immediately
  const products = await localDB.getProducts();
  products.push(product);
  await localDB.saveProducts(products);
  
  return result;
}

export async function updateProduct(code, payload) {
  // Optimistically update IndexedDB
  await localDB.updateProduct(code, payload);
  
  try {
    const result = await fetchJSON(`?action=productUpdate&code=${encodeURIComponent(code)}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return result;
  } catch (error) {
    // Rollback on error
    await syncProducts();
    throw error;
  }
}

export async function adjustStock(code, change) {
  // Optimistically update IndexedDB
  const product = await localDB.getProduct(code);
  if (product) {
    await localDB.updateProduct(code, { 
      stock: Math.max(0, product.stock + change) 
    });
  }
  
  try {
    const result = await fetchJSON(`?action=adjustStock&code=${encodeURIComponent(code)}`, {
      method: 'POST',
      body: JSON.stringify({ change })
    });
    return result;
  } catch (error) {
    // Rollback on error
    await syncProducts();
    throw error;
  }
}

export async function getBills(forceRefresh = false) {
  if (forceRefresh) {
    const bills = await fetchJSON('?action=bills');
    await localDB.saveBills(bills);
    return bills;
  }
  
  return await localDB.getBills();
}

export async function createBill(bill) {
  // Optimistically update stock in IndexedDB
  for (const item of bill.items) {
    const product = await localDB.getProduct(item.code);
    if (product) {
      await localDB.updateProduct(item.code, {
        stock: Math.max(0, product.stock - item.quantity)
      });
    }
  }
  
  try {
    const result = await fetchJSON('?action=bill', {
      method: 'POST',
      body: JSON.stringify(bill)
    });
    
    // Refresh bills in background
    setTimeout(() => getBills(true), 100);
    
    return result;
  } catch (error) {
    // Rollback on error
    await syncProducts();
    throw error;
  }
}

// Manual refresh
export async function forceSync() {
  await syncProducts();
  return await getProducts({}, true);
}

// Get sync status
export async function getSyncStatus() {
  const lastSync = await localDB.getLastSync();
  return {
    lastSync: lastSync ? new Date(lastSync) : null,
    syncing: syncInProgress,
    nextSync: lastSync ? new Date(lastSync + SYNC_INTERVAL) : null
  };
}