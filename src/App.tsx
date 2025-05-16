//import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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
//import Dashboard from './pages/Dashboard';
//import ItemDetails from './pages/ItemDetails';
//import Chat from './pages/Chat';
//import ListingCharge from './pages/ListingCharge';

function App() {
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
              <Route path="/personal-data" element={<PersonalData />} />
              <Route path="/id-verification" element={<IdVerification />} />
              <Route path="/list-item" element={<ItemListing />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/success" element={<SuccessMessage />} />
              <Route path="/terms" element={<Terms />} />
              {/* <Route path="/dashboard/*" element={<Dashboard />} /> */}
              {/* <Route path="/items/:id" element={<ItemDetails />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/listing-charge" element={<ListingCharge />} /> */}
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;