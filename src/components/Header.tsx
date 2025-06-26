import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleMenuToggle = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const handleMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      setProfileDropdownOpen(false);
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSettingsClick = () => {
    setProfileDropdownOpen(false);
    navigate('/settings');
  };

  const handleProfileClick = () => {
    setProfileDropdownOpen(false);
    navigate('/dashboard');
  };

  return (
    <header className="bg-[#4A0E67] text-white py-1.5 shadow-md relative z-50 animate-fade-in">
      <div className="container mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center">
          <img
            src="https://imgur.com/CtN9l7s.png"
            alt="LizExpress"
            className="h-[110px] w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="hover:text-[#F7941D] text-base transition-colors">HOME</Link>
          <Link to="/browse" className="hover:text-[#F7941D] text-base transition-colors">BROWSE</Link>
          {user && (
            <>
              <Link to="/dashboard" className="hover:text-[#F7941D] text-base transition-colors">DASHBOARD</Link>
              <Link to="/list-item" className="hover:text-[#F7941D] text-base transition-colors">LIST ITEM</Link>
            </>
          )}
          
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 bg-[#F7941D] text-white px-4 py-2 rounded-full font-bold hover:bg-[#e68a1c] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-white overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#4A0E67] flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="hidden lg:inline">{profile?.full_name || 'My Account'}</span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    <User size={16} className="mr-2" />
                    My Profile
                  </button>
                  <button
                    onClick={handleSettingsClick}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    <Settings size={16} className="mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/signin"
              className="bg-[#F7941D] text-white px-6 py-2 rounded-full font-bold hover:bg-[#e68a1c] text-base transition-colors"
            >
              SIGN IN
            </Link>
          )}
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-white z-50"
          onClick={handleMenuToggle}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Nav - Half Drawer */}
      <div
        className={`fixed top-[70px] right-0 h-[70%] w-[70%] max-w-[300px] bg-[#4A0E67] shadow-lg z-40 rounded-l-xl transform ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <nav className="flex flex-col p-6 space-y-5">
          <Link to="/" onClick={handleMenuClose} className="text-white hover:text-[#F7941D] text-base transition-colors">
            HOME
          </Link>
          <Link to="/browse" onClick={handleMenuClose} className="text-white hover:text-[#F7941D] text-base transition-colors">
            BROWSE
          </Link>
          {user && (
            <>
              <Link to="/dashboard" onClick={handleMenuClose} className="text-white hover:text-[#F7941D] text-base transition-colors">
                DASHBOARD
              </Link>
              <Link to="/list-item" onClick={handleMenuClose} className="text-white hover:text-[#F7941D] text-base transition-colors">
                LIST ITEM
              </Link>
            </>
          )}
          
          {user ? (
            <div className="space-y-3 pt-4 border-t border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white overflow-hidden">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F7941D] flex items-center justify-center">
                      <User size={20} className="text-white" />
                    </div>
                  )}
                </div>
                <span className="text-white font-medium">{profile?.full_name || 'User'}</span>
              </div>
              <button
                onClick={() => {
                  handleSettingsClick();
                  handleMenuClose();
                }}
                className="w-full bg-[#F7941D] text-white px-4 py-2 rounded font-bold text-center hover:bg-[#e68a1c] transition-colors"
              >
                SETTINGS
              </button>
              <button
                onClick={() => {
                  handleSignOut();
                  handleMenuClose();
                }}
                className="w-full bg-red-600 text-white px-4 py-2 rounded font-bold text-center hover:bg-red-700 transition-colors"
              >
                SIGN OUT
              </button>
            </div>
          ) : (
            <Link
              to="/signin"
              onClick={handleMenuClose}
              className="bg-[#F7941D] text-white px-6 py-3 rounded-full font-bold text-center hover:bg-[#e68a1c] text-base transition-colors"
            >
              SIGN IN
            </Link>
          )}
        </nav>
      </div>

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={handleMenuClose}
        />
      )}

      {/* Overlay for profile dropdown */}
      {profileDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}
    </header>
  );
};

export default Header;
