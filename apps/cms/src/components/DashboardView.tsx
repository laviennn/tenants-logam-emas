import React from 'react'
import DashboardStats from './DashboardStats'
import DeployButton from './DeployButton'

// This is a Server Component (default in Next.js)
// Payload passes non-serializable props (like locale with toString)
// We only pass what we need to the Client Component
export const DashboardView: React.FC = (props: any) => {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#111827', margin: 0 }}>
          📊 Dashboard Statistik
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
          Ringkasan transaksi dan pendapatan platform Logam Mulia.
        </p>
      </div>

      {/* Manual Deploy Button */}
      <DeployButton />

      {/* Client-side stats component */}
      <DashboardStats />
    </div>
  )
}

export default DashboardView
