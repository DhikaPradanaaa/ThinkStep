'use client'

import React, { useState } from 'react';
import LinkChildModal from './LinkChildModal';

export default function AddChildButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="btn-primary"
      >
        + Tambah Anak
      </button>
      
      {isOpen && <LinkChildModal onClose={() => setIsOpen(false)} />}
    </>
  );
}
