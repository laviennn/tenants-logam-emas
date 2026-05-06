'use client'
import React, { useEffect, useState } from 'react'

type Stats = {
  totalRevenue: number
  totalOrders: number
  pendingOrders: number
  paidOrders: number
  completedOrders: number
  recentOrders: Array<{
    id: string
    orderId: string
    customerDetails: { name: string; email: string }
    total: number
    status: string
    createdAt: string
  }>
}

const statusColor: Record<string, string> = {
  Pending: '#f59e0b',
  Paid: '#3b82f6',
  Shipped: '#8b5cf6',
  Completed: '#10b981',
  Cancelled: '#ef4444',
}

const formatRp = (v: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/transactions?limit=1000&depth=0')
        const data = await res.json()
        const docs = data.docs || []

        const totalRevenue = docs
          .filter((d: any) => d.status === 'Paid' || d.status === 'Completed')
          .reduce((acc: number, d: any) => acc + (d.total || 0), 0)

        setStats({
          totalRevenue,
          totalOrders: docs.length,
          pendingOrders: docs.filter((d: any) => d.status === 'Pending').length,
          paidOrders: docs.filter((d: any) => d.status === 'Paid').length,
          completedOrders: docs.filter((d: any) => d.status === 'Completed').length,
          recentOrders: docs.slice(0, 8),
        })
      } catch (e) {
        console.error('[Dashboard] Failed to fetch stats:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
        <p>Memuat statistik...</p>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    { label: 'Total Pendapatan', value: formatRp(stats.totalRevenue), icon: '💰', color: '#d97706' },
    { label: 'Total Transaksi', value: stats.totalOrders.toString(), icon: '📦', color: '#2563eb' },
    { label: 'Menunggu Konfirmasi', value: stats.pendingOrders.toString(), icon: '⏳', color: '#f59e0b' },
    { label: 'Pembayaran Dikonfirmasi', value: stats.paidOrders.toString(), icon: '✅', color: '#3b82f6' },
    { label: 'Selesai', value: stats.completedOrders.toString(), icon: '🎉', color: '#10b981' },
  ]

  return (
    <>
      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              border: '1px solid #f3f4f6',
              borderLeft: `4px solid ${card.color}`,
            }}
          >
            <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{card.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders Table */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Transaksi Terbaru</h2>
          <a href="/admin/collections/transactions" style={{ fontSize: '0.85rem', color: '#2563eb', textDecoration: 'none' }}>
            Lihat Semua →
          </a>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Order ID', 'Pelanggan', 'Total', 'Status', 'Waktu'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af' }}>
                    Belum ada transaksi.
                  </td>
                </tr>
              ) : stats.recentOrders.map((order) => (
                <tr key={order.orderId} style={{ borderTop: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#1f2937', fontFamily: 'monospace' }}>
                    <a href={`/admin/collections/transactions/${order.id || order.orderId}`} style={{ textDecoration: 'none', color: '#2563eb' }}>
                      {order.orderId}
                    </a>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#374151' }}>
                    <div style={{ fontWeight: 500 }}>{order.customerDetails?.name || '—'}</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{order.customerDetails?.email || ''}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#d97706' }}>
                    {formatRp(order.total || 0)}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      background: statusColor[order.status] + '20',
                      color: statusColor[order.status],
                      border: `1px solid ${statusColor[order.status]}50`,
                      borderRadius: '999px',
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                    {new Date(order.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default DashboardStats
