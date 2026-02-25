import { useState, useEffect } from 'react';
import { PocketBaseProvider, usePocketBase } from './context/SupabaseContext';
import { PlannerProvider } from './context/PlannerContext';
import { Auth } from './components/Auth';
import TopBar from './components/TopBar';
import Timeline from './components/Timeline';
import LiveStatus from './components/LiveStatus';
import BottomNav from './components/BottomNav';
import Analysis from './components/Analysis';
import Settings from './components/Settings';
import Circles from './components/Circles';
import NotificationManager from './components/NotificationManager';
import StaleActivityDetector from './components/StaleActivityDetector';
import { usePlanner } from './context/PlannerContext';
import './index.css';

function AppContent() {
  const { state } = usePlanner();
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme || 'dark';
  }, [state.theme]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <NotificationManager />
      <StaleActivityDetector />
      <TopBar />

      <main style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingBottom: '100px', // Space for BottomNav
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {activeTab === 'timeline' && (
          <>
            <LiveStatus />
            <Timeline />
          </>
        )}
        {activeTab === 'analysis' && <Analysis />}
        {activeTab === 'circles' && <Circles onTabChange={setActiveTab} />}
        {activeTab === 'me' && <Settings />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function AuthenticatedApp() {
  const { user, loading } = usePocketBase();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--color-bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid var(--color-card-border)',
            borderTopColor: 'var(--color-accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return <AppContent />;
}

function App() {
  return (
    <PocketBaseProvider>
      <AuthenticatedApp />
    </PocketBaseProvider>
  );
}

export default App;
