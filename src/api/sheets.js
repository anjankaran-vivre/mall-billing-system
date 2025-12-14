// src/api/sheets.js — WORKING POST SOLUTION
const BASE = import.meta.env.VITE_SHEETS_API || '';

async function fetchJSON(url, opts = {}) {
  if (!BASE) throw new Error('SHEETS_API_NOT_CONFIGURED');
  
  const fullUrl = `${BASE}${url}`;
  console.log('Fetching:', fullUrl, opts);
  
  // For POST requests to Apps Script, we need special handling
  if (opts.method === 'POST') {
    // Use FormData approach which works better with Apps Script
    const formData = new FormData();
    formData.append('data', opts.body);
    
    const res = await fetch(fullUrl, {
      method: 'POST',
      body: formData,
      redirect: 'follow'
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error('POST error:', res.status, text);
      throw new Error(`Error ${res.status}: ${text}`);
    }
    
    const data = await res.json();
    console.log('POST Response:', data);
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  }
  
  // Regular GET request
  const res = await fetch(fullUrl);
  
  if (!res.ok) {
    const text = await res.text();
    console.error('GET error:', res.status, text);
    throw new Error(`Error ${res.status}: ${text}`);
  }
  
  const data = await res.json();
  console.log('GET Response:', data);
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
}

// GET requests
export async function getProducts() {
  return fetchJSON('?action=products');
}

export async function getProductByCode(code) {
  return fetchJSON(`?action=product&code=${encodeURIComponent(code)}`);
}

export async function getBills() {
  return fetchJSON('?action=bills');
}

// POST requests
export async function addProduct(product) {
  return fetchJSON('?action=product', {
    method: 'POST',
    body: JSON.stringify(product)
  });
}

export async function updateProduct(code, payload) {
  return fetchJSON(`?action=productUpdate&code=${encodeURIComponent(code)}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function adjustStock(code, change) {
  return fetchJSON(`?action=adjustStock&code=${encodeURIComponent(code)}`, {
    method: 'POST',
    body: JSON.stringify({ change })
  });
}

export async function createBill(bill) {
  return fetchJSON('?action=bill', {
    method: 'POST',
    body: JSON.stringify(bill)
  });
}