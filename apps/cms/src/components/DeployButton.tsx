'use client'
import React, { useState } from 'react'

export const DeployButton: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleDeploy = async () => {
    if (
      !confirm(
        'Apakah Anda yakin ingin memperbarui website sekarang? Proses ini akan memakan waktu sekitar 6 menit.',
      )
    ) {
      return
    }

    setStatus('loading')
    setMessage('Memulai proses pembaruan...')

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
      })

      if (res.ok) {
        setStatus('success')
        setMessage('✅ Build berhasil dipicu! Silakan tunggu 5-10 Menit.')
        // Reset after 10 seconds
        setTimeout(() => setStatus('idle'), 10000)
      } else {
        throw new Error('Gagal memicu build')
      }
    } catch (error) {
      console.error(error)
      setStatus('error')
      setMessage('❌ Gagal memperbarui website. Pastikan koneksi internet stabil.')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        border: '1px solid #f3f4f6',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1', minWidth: '300px' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#111827' }}>
          🚀 Publikasikan Perubahan
        </h3>
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#6b7280' }}>
          Gunakan tombol ini setelah Anda selesai mengedit produk atau harga untuk memperbarui
          website publik.
        </p>
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}
      >
        <button
          onClick={handleDeploy}
          disabled={status === 'loading'}
          style={{
            background: status === 'loading' ? '#9ca3af' : '#2563eb',
            color: '#fff',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontSize: '0.9rem',
            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
          }}
          onMouseOver={(e) =>
            status !== 'loading' && (e.currentTarget.style.background = '#1d4ed8')
          }
          onMouseOut={(e) => status !== 'loading' && (e.currentTarget.style.background = '#2563eb')}
        >
          {status === 'loading' ? '⌛ Sedang Memproses...' : 'Perbarui Website Sekarang'}
        </button>

        {message && (
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: status === 'success' ? '#10b981' : status === 'error' ? '#ef4444' : '#2563eb',
            }}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  )
}

export default DeployButton
