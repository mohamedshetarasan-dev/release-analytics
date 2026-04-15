import { NavLink } from 'react-router-dom';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/compare', label: 'Compare Releases' },
  { to: '/import', label: 'Import Data' },
  { to: '/releases', label: 'Releases' },
  { to: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <nav style={{
      width: 220, background: '#1F3864', color: '#fff',
      display: 'flex', flexDirection: 'column', padding: '24px 0',
    }}>
      <div style={{ padding: '0 20px 24px', fontWeight: 700, fontSize: 16, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        Release Analytics
      </div>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          style={({ isActive }) => ({
            padding: '12px 20px', color: '#fff', opacity: isActive ? 1 : 0.65,
            background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            borderLeft: isActive ? '3px solid #63b3ed' : '3px solid transparent',
          })}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
