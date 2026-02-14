import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx';
import { PlannerProvider } from './context/PlannerContext.jsx'; // We need to move this up if Auth depends on it

// Ideally Auth depends on Planner, but Planner doesn't depend on Auth?
// Actually AuthContext uses usePlanner() inside it to access state. 
// So PlannerProvider MUST be outside AuthProvider.

const CLIENT_ID = '785068663116-n9gmtlsifn0kpj8oe17q9vv1m2ntbnsu.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <PlannerProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </PlannerProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
