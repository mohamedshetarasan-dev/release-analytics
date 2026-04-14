export default function Header() {
  return (
    <header style={{
      background: '#fff', borderBottom: '1px solid #e2e8f0',
      padding: '0 24px', height: 56, display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <span style={{ fontWeight: 600, color: '#2d3748' }}>Release Analytics</span>
      <span style={{ fontSize: 13, color: '#718096' }}>Phase 1 — Excel Import</span>
    </header>
  );
}
