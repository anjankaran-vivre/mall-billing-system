import React, { useRef } from 'react';

export default function BarcodeInput({ onScan }) {
  const ref = useRef();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const v = e.target.value.trim();
      if (v) {
        onScan(v);
        e.target.value = '';
      }
    }
  };

  return (
    <input
      ref={ref}
      onKeyDown={handleKeyDown}
      placeholder="Scan or type code and press Enter"
      className="w-full px-3 py-2 border rounded"
      autoFocus
    />
  );
}
