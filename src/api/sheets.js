// src/api/sheets.js - FINAL WORKING VERSION
const BASE = import.meta.env.VITE_SHEETS_API || '';
const IS_APPS_SCRIPT = BASE.includes('script.google.com');

async function fetchJSON(pathOrAction, opts = {}) {
  if (!BASE) {
    throw new Error('SHEETS_API_NOT_CONFIGURED');
  }

  const baseStripped = BASE.replace(/\/$/, '');
  let url = '';

  if (IS_APPS_SCRIPT) {
    // Apps Script reads action from query params
    if (typeof pathOrAction === 'string' && pathOrAction.includes('action=')) {
      url = `${baseStripped}${pathOrAction}`;
    } else if (typeof pathOrAction === 'string' && !pathOrAction.startsWith('?')) {
      url = `${baseStripped}?action=${encodeURIComponent(pathOrAction)}`;
    } else {
      url = `${baseStripped}${pathOrAction}`;
    }
  } else {
    url = `${baseStripped}${pathOrAction}`;
  }

  const response = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text || 'Failed to fetch'}`);
  }

  return response.json();
}

// GET ALL PRODUCTS
export async function getProducts() {
  if (!BASE) return [];
  return fetchJSON('products');
}

// GET SINGLE PRODUCT BY CODE
export async function getProductByCode(code) {
  if (!BASE) return null;
  return fetchJSON(`product&code=${encodeURIComponent(code)}`);
}

// ADD NEW PRODUCT
export async function addProduct(product) {
  if (!BASE) throw new Error('No API');
  return fetchJSON('product', {
    method: 'POST',
    body: JSON.stringify(product)
  });
}

// UPDATE ANY PRODUCT FIELD (name, price, stock, etc)
export async function updateProduct(code, payload) {
  if (!BASE) throw new Error('No API');
  return fetchJSON(`productUpdate&code=${encodeURIComponent(code)}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// ADJUST STOCK (+ or -)
export async function adjustStock(code, change) {
  if (!BASE) throw new Error('No API');
  return fetchJSON(`adjustStock&code=${encodeURIComponent(code)}`, {
    method: 'POST',
    body: JSON.stringify({ change })
  });
}

// CREATE BILL + DEDUCT STOCK
export async function createBill(bill) {
  if (!BASE) throw new Error('No API');
  return fetchJSON('bill', {
    method: 'POST',
    body: JSON.stringify(bill)
  });
}

// GET ALL BILLS
export async function getBills() {
  if (!BASE) return [];
  return fetchJSON('bills');
}