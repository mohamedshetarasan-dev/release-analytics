import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface Props { children: ReactNode }

export default function AppShell({ children }: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ flex: 1, padding: '24px' }}>{children}</main>
      </div>
    </div>
  );
}
