import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icon } from './Primitives';

export const NAV = [
  { label: 'HOME' },
  { id: 'dashboard', icon: 'aperture', title: 'ภาพรวมสถานะโครงการ', path: '/dashboards/modern' },
  { label: 'การติดตามงาน', tag: 'ใหม่' },
  { id: 'pr', icon: 'clipboard-list', title: 'คำขอผลิต (PR)', badge: '8', path: null },
  { id: 'po', icon: 'file-invoice', title: 'ใบสั่งซื้อวัตถุดิบ (PO)', path: '/forms/form-po' },
  { id: 'issues', icon: 'alert-triangle', title: 'ปัญหา / ข้อบกพร่อง', badge: '12', badgeColor: '#DC4B4B', path: null },
  { label: 'นำเข้าข้อมูลพรีคาสท์สู่ระบบ' },
  { id: 'new-project', icon: 'home-plus', title: 'สร้างโครงการใหม่', path: '/forms/form-project' },
  { id: 'new-section', icon: 'brand-codepen', title: 'สร้างข้อมูลชั้น', path: '/forms/form-section' },
  { id: 'new-comp', icon: 'box', title: 'สร้างข้อมูลชิ้นงาน', path: '/forms/form-component' },
  { label: 'QR CODE' },
  { id: 'qr-read', icon: 'zoom-code', title: 'โปรแกรมอ่าน QR Code', path: '/forms/form-qr-code-reader' },
  { id: 'qr-make', icon: 'qrcode', title: 'โปรแกรมสร้าง QR Code', path: '/pages/qr-code' },
  { label: 'AUTH' },
  { id: 'login', icon: 'login', title: 'เข้าสู่ระบบ', path: '/auth/login' },
  { id: 'register', icon: 'user-plus', title: 'ลงทะเบียนผู้ใช้งาน', path: '/auth/register' },
];

export function Sidebar({ collapsed, accent, user, onLogout }) {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const open = !collapsed || hover;

  const initials = user
    ? (user.name || user.username || 'U').slice(0, 2).toUpperCase()
    : 'AN';
  const displayName = user ? (user.name || user.username || 'ผู้ใช้งาน') : 'อนุชา ว.';
  const role = user ? (user.role || 'User') : 'Admin';

  return (
    <aside
      className="mes-sidebar"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width: open ? 248 : 72 }}
    >
      {/* Brand */}
      <div className="sb-brand">
        <div className="sb-mark">
          <svg viewBox="0 0 208.24 208.24" width="26" height="26" aria-label="SFC">
            <rect fill="none" stroke="#2A3547" strokeWidth="6" x="30.5" y="30.5" width="147.25" height="147.25" transform="translate(-43.13 104.12) rotate(-45)" />
            <circle fill="#5D87FF" cx="104.12" cy="104.12" r="63.41" />
            <path fill="#ffffff" d="M83.43,91.31,75.3,94c-1.1-3.23-3.41-4.84-7-4.84q-5.67,0-5.67,3.68a3.34,3.34,0,0,0,1.06,2.48c.71.68,2.31,1.26,4.79,1.76a47.26,47.26,0,0,1,9.14,2.55,11.57,11.57,0,0,1,4.88,4.14,10.94,10.94,0,0,1,2,6.38,12.74,12.74,0,0,1-4.26,9.56q-4.26,4-12.62,4A19.18,19.18,0,0,1,57,120.92a13.57,13.57,0,0,1-5.81-8.47l8.85-2q1.5,5.72,8.3,5.71a7.83,7.83,0,0,0,4.89-1.27,3.75,3.75,0,0,0,1.61-3,3.17,3.17,0,0,0-1.46-2.78,17.47,17.47,0,0,0-5.65-1.85q-7.78-1.62-11.1-4.42T53.3,94.63a12.12,12.12,0,0,1,4-9.18q4-3.74,10.74-3.73Q80,81.72,83.43,91.31Z" />
            <path fill="#ffffff" d="M119.81,90.42h-19.1v9.14h15.1v7.63h-15.1v16H90.78V82.34h29Z" />
            <path fill="#ffffff" d="M157.63,97.53l-10,.63q-.21-8.64-6.74-8.64-7.49,0-7.49,13.3,0,7.68,2,10.42a6.71,6.71,0,0,0,5.69,2.74q5.94,0,7.25-7.72l9.27.57q-.9,7.32-5.46,11.14a18.28,18.28,0,0,1-24.33-1.78q-5.07-5.59-5.07-15.46,0-9.24,4.9-15.13t13.4-5.88Q155.77,81.72,157.63,97.53Z" />
          </svg>
        </div>
        <div className="sb-word" style={{ opacity: open ? 1 : 0 }}>
          <div className="sb-word-main">SFC<span>·PC</span></div>
          <div className="sb-word-sub">PRECAST MES</div>
        </div>
      </div>

      <nav className="sb-nav">
        {NAV.map((item, i) => {
          if (item.label) {
            return (
              <div key={i} className="sb-section" style={{ opacity: open ? 1 : 0 }}>
                <span>{item.label}</span>
                {item.tag && <em className="sb-section-tag">{item.tag}</em>}
              </div>
            );
          }
          const isActive = item.path && location.pathname === item.path;
          return (
            <button
              key={i}
              className={'sb-item' + (isActive ? ' is-active' : '')}
              onClick={() => item.path && navigate(item.path)}
              title={item.title}
              style={isActive ? { '--accent': accent } : undefined}
            >
              <span className="sb-ic"><Icon name={item.icon} size={20} /></span>
              <span className="sb-label" style={{ opacity: open ? 1 : 0 }}>{item.title}</span>
              {item.badge && (
                <span
                  className="sb-badge"
                  style={{
                    background: item.badgeColor || 'rgba(255,255,255,.14)',
                    marginLeft: 'auto',
                    opacity: open ? 1 : 0,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sb-foot">
        <div className="sb-user">
          <div className="sb-avatar" style={{ background: accent }}>{initials}</div>
          <div className="sb-user-info" style={{ opacity: open ? 1 : 0 }}>
            <div className="sb-user-name">{displayName}</div>
            <div className="sb-user-role">{role} · ผู้ดูแลระบบ</div>
          </div>
          <span className="sb-logout" style={{ opacity: open ? 1 : 0 }}
            onClick={onLogout} title="ออกจากระบบ">
            <Icon name="logout" size={17} />
          </span>
        </div>
      </div>
    </aside>
  );
}
