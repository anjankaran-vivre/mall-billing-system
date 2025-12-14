// src/api/sheets.js — FIXED VERSION
const BASE = import.meta.env.VITE_SHEETS_API || '';
const IS_APPS_SCRIPT = BASE.includes('script.google.com');

async function fetchJSON(pathOrAction, opts = {}) {
  if (!BASE) throw new Error('SHEETS_API_NOT_CONFIGURED');
  
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

  // CRITICAL FIX: Apps Script needs redirect: 'follow'
  const fetchOptions = {
    ...opts,
    redirect: 'follow',  // ← This is crucial for Apps Script POST
  };

  console.log('Fetching:', url, fetchOptions); // Debug log

  const res = await fetch(url, fetchOptions);
  
  if (!res.ok) {
    const text = await res.text();
    console.error('Fetch error:', res.status, text);
    throw new Error(`Error ${res.status}: ${text}`);
  }
  
  const data = await res.json();
  console.log('Response:', data); // Debug log
  return data;
}

// GET requests
export async function getProducts() { 
  return fetchJSON('products'); 
}

export async function getProductByCode(code) { 
  return fetchJSON(`?action=product&code=${encodeURIComponent(code)}`); 
}

export async function getBills() { 
  return fetchJSON('bills'); 
}

// POST requests
export async function addProduct(product) { 
  return fetchJSON('?action=product', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(product),
    mode: 'cors', // ← Add this
  }); 
}

export async function updateProduct(code, payload) { 
  return fetchJSON(`?action=productUpdate&code=${encodeURIComponent(code)}`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(payload),
    mode: 'cors', // ← Add this
  }); 
}

export async function adjustStock(code, change) { 
  return fetchJSON(`?action=adjustStock&code=${encodeURIComponent(code)}`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ change }),
    mode: 'cors', // ← Add this
  }); 
}

export async function createBill(bill) { 
  return fetchJSON('?action=bill', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(bill),
    mode: 'cors', // ← Add this
  }); 
}