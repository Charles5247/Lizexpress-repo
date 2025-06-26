import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import SignIn from './components/auth/SignIn';
import SignUp from './components/auth/SignUp';
import PersonalData from './components/auth/PersonalData';
import IdVerification from './components/auth/IdVerification';
import ItemListing from './components/listing/ItemListing';
import Browse from './pages/Browse';
import SuccessMessage from './components/auth/SuccessMessage';
import Terms from './pages/Terms';
import Dashboard from './pages/Dashboard';
import ItemDetails from './pages/ItemDetails';
import Chat from './pages/Chat';
import ListingCharge from './pages/ListingCharge';
import EmailConfirmation from './components/auth/EmailConfirmation';
import Settings from './pages/Settings';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/signin" />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const { user } = useAuth();

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          localStorage.setItem('userLocation', JSON.stringify({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  return (
    <Router>
      <Routes>
        {/* Admin Routes - Completely separate */}
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        
        {/* All other routes with header/footer */}
        <Route path="/*" element={
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <Header />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/items/:id" element={<ItemDetails />} />
                <Route path="/email-confirmation" element={<EmailConfirmation />} />
                
                {/* Protected Routes */}
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="/personal-data" element={
                  <ProtectedRoute>
                    <PersonalData />
                  </ProtectedRoute>
                } />
                <Route path="/id-verification" element={
                  <ProtectedRoute>
                    <IdVerification />
                  </ProtectedRoute>
                } />
                <Route path="/list-item" element={
                  <ProtectedRoute>
                    <ItemListing />
                  </ProtectedRoute>
                } />
                <Route path="/success" element={
                  <ProtectedRoute>
                    <SuccessMessage />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/*" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/chat/:id" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />
                <Route path="/listing-charge" element={
                  <ProtectedRoute>
                    <ListingCharge />
                  </ProtectedRoute>
                } />
              </Routes>
            </main>
            <Footer />
          </div>
        } />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;