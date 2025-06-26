import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Footer: React.FC = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-[#4A0E67] text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Navigation Links */}
          <div>
            <ul className="space-y-2">
              <li><a href="/" className="hover:text-[#F7941D] transition-colors">Home</a></li>
              <li><a href="/browse" className="hover:text-[#F7941D] transition-colors">Browse</a></li>
              {user && (
                <li><a href="/dashboard" className="hover:text-[#F7941D] transition-colors">Dashboard</a></li>
              )}
              <li><a href="/terms" className="hover:text-[#F7941D] transition-colors">Terms & Conditions</a></li>
              <li><a href="#" className="hover:text-[#F7941D] transition-colors">Privacy Policies</a></li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-[#F7941D] transition-colors">Electronics</a></li>
              <li><a href="#" className="hover:text-[#F7941D] transition-colors">Furniture</a></li>
              <li><a href="#" className="hover:text-[#F7941D] transition-colors">Phones & Accessories</a></li>
              <li><a href="#" className="hover:text-[#F7941D] transition-colors">Computer & Accessories</a></li>
            </ul>
          </div>
          
          {/* Newsletter */}
          <div>
            <div className="bg-[#F7941D] p-4 rounded">
              <h3 className="font-bold mb-2">Subscribe to our Newsletter!</h3>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Enter your Email"
                  className="flex-grow px-3 py-1 text-black rounded-l"
                />
                <button className="bg-[#4A0E67] px-4 py-1 rounded-r">
                  GO
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-8 text-sm text-center md:text-left">
          <p>Copyright LizExpress 2023</p>
          <p>Website by ViSiON Studios</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;