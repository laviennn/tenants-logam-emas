'use client'
import React from 'react'
import Link from 'next/link'

export const SidebarDashboardLink: React.FC = () => {
  return (
    <div style={{ padding: '0 0.5rem 1rem 0.5rem' }}>
      <style>{`
        .sidebar-dash-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          text-decoration: none;
          color: #111827;
          font-weight: 700;
          background: #f3f4f6;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .sidebar-dash-link:hover {
          background: #e5e7eb !important;
        }
      `}</style>
      <Link 
        href="/admin" 
        className="sidebar-dash-link"
      >
        <span style={{ fontSize: '1.25rem' }}>📊</span>
        <span>Dashboard Statistik</span>
      </Link>
    </div>
  )
}

export default SidebarDashboardLink
