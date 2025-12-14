  const BASE = import.meta.env.VITE_SHEETS_API || '';
  const IS_APPS_SCRIPT = BASE.includes('script.google.com');

  async function fetchJSON(pathOrAction, opts = {}) {
    if (!BASE) {
      throw new Error('SHEETS_API_NOT_CONFIGURED');
    }
    const baseStripped = BASE.replace(/\/$/, '');
    let url = '';
    if (IS_APPS_SCRIPT) {
      // map path like '/products' to action=products, or pass through if already an action
      if (pathOrAction.startsWith('/')) {
        const action = pathOrAction.replace(/^\//, '');
        url = `${baseStripped}?action=${encodeURIComponent(action)}`;
      } else if (pathOrAction.startsWith('?') || pathOrAction.includes('action=')) {
        url = `${baseStripped}${pathOrAction}`;
      } else {
        url = `${baseStripped}?action=${encodeURIComponent(pathOrAction)}`;
      }
    } else {
      url = `${baseStripped}${pathOrAction}`;
    }
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
  }

  function readLocalProducts() {
    try {
      const raw = localStorage.getItem('products');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function writeLocalProducts(list) {
    localStorage.setItem('products', JSON.stringify(list));
  }

  function readLocalBills() {
    try { return JSON.parse(localStorage.getItem('bills') || '[]'); } catch (e) { return []; }
  }

  function writeLocalBills(list) { localStorage.setItem('bills', JSON.stringify(list)); }

  export async function getProducts() {
    if (!BASE) return readLocalProducts();
    if (IS_APPS_SCRIPT) return fetchJSON('products');
    return fetchJSON('/products');
  }

  export async function getProductByCode(code) {
    if (!BASE) {
      const products = readLocalProducts() || [];
      return products.find(p => p.code === String(code) || p.name === String(code));
    }
    if (IS_APPS_SCRIPT) return fetchJSON(`?action=product&code=${encodeURIComponent(code)}`);
    return fetchJSON(`/product/${encodeURIComponent(code)}`);
  }

  export async function addProduct(product) {
    if (!BASE) {
      const products = readLocalProducts() || [];
      products.push(product);
      writeLocalProducts(products);
      return product;
    }
    if (IS_APPS_SCRIPT) return fetchJSON('?action=product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
    return fetchJSON('/product', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(product) });
  }

  export async function updateStock(code, newStock) {
    if (!BASE) {
      const products = readLocalProducts() || [];
      const updated = products.map(p => p.code === code ? { ...p, stock: newStock } : p);
      writeLocalProducts(updated);
      return updated.find(p => p.code === code);
    }
    if (IS_APPS_SCRIPT) return fetchJSON(`?action=productUpdate&code=${encodeURIComponent(code)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: newStock }) });
    return fetchJSON(`/stock/${encodeURIComponent(code)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stock: newStock }) });
  }

  export async function adjustStock(code, change) {
    if (!BASE) {
      const products = readLocalProducts() || [];
      const updated = products.map(p => p.code === code ? { ...p, stock: Math.max(0, p.stock + change) } : p);
      writeLocalProducts(updated);
      return updated.find(p => p.code === code);
    }
    if (IS_APPS_SCRIPT) return fetchJSON(`?action=adjustStock&code=${encodeURIComponent(code)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ change }) });
    return fetchJSON(`/stock/adjust/${encodeURIComponent(code)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ change }) });
  }

  export async function createBill(bill) {
    if (!BASE) {
      const bills = readLocalBills();
      bills.unshift(bill);
      writeLocalBills(bills);
      // adjust local products
      const products = readLocalProducts() || [];
      const updated = products.map(p => {
        const found = (bill.items || []).find(i => i.code === p.code);
        if (found) return { ...p, stock: Math.max(0, p.stock - found.quantity) };
        return p;
      });
      writeLocalProducts(updated);
      return bill;
    }
    if (IS_APPS_SCRIPT) return fetchJSON('?action=bill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bill) });
    return fetchJSON('/bill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bill) });
  }

  export async function updateProduct(code, payload) {
    if (!BASE) {
      const products = readLocalProducts() || [];
      const updated = products.map(p => p.code === code ? { ...p, ...payload } : p);
      writeLocalProducts(updated);
      return updated.find(p => p.code === code);
    }
    if (IS_APPS_SCRIPT) return fetchJSON(`?action=productUpdate&code=${encodeURIComponent(code)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return fetchJSON(`/product/${encodeURIComponent(code)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  }

  export async function getBills() {
    if (!BASE) return readLocalBills();
    if (IS_APPS_SCRIPT) return fetchJSON('bills');
    return fetchJSON('/bills');
  }
