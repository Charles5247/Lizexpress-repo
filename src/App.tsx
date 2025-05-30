import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/signin" />;
  }
  
  return <>{children}</>;
};

function App() {
  useEffect(() => {
    // Request location permission when the app loads
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
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/items/:id" element={<ItemDetails />} />
              
              {/* Protected Routes */}
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
      </Router>
    </AuthProvider>
  );
}

export default App;