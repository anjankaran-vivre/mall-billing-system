// src/api/sheets.js → YOUR ORIGINAL (this one was fetching products correctly)
const BASE = import.meta.env.VITE_SHEETS_API || '';
const IS_APPS_SCRIPT = BASE.includes('script.google.com');

async function fetchJSON(pathOrAction, opts = {}) {
  if (!BASE) {
    throw new Error('SHEETS_API_NOT_CONFIGURED');
  }
  const baseStripped = BASE.replace(/\/$/, '');
  let url = '';
  if (IS_APPS_SCRIPT) {
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

export async function getProducts() {
  if (!BASE) return [];
  return fetchJSON('products');
}

export async function getProductByCode(code) {
  if (!BASE) return null;
  return fetchJSON(`?action=product&code=${encodeURIComponent(code)}`);
}

export async function addProduct(product) {
  if (!BASE) throw new Error('No API');
  return fetchJSON('?action=product', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(product) 
  });
}

export async function adjustStock(code, change) {
  if (!BASE) throw new Error('No API');
  return fetchJSON(`?action=adjustStock&code=${encodeURIComponent(code)}`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ change }) 
  });
}

export async function createBill(bill) {
  if (!BASE) throw new Error('No API');
  return fetchJSON('?action=bill', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(bill) 
  });
}

export async function getBills() {
  if (!BASE) return [];
  return fetchJSON('bills');
}