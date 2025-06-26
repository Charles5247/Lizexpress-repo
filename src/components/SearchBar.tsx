import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SearchBar: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (category !== 'all') {
      params.set('category', category);
    }
    navigate(`/browse?${params.toString()}`);
  };

  return (
    <section className="bg-[#F7941D] py-3">
      <div className="container mx-auto px-4">
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-2"
        >
          <div className="text-white text-sm text-center md:text-left">
            Welcome to LizExpress where you swap and advertise your service...
          </div>

          <div className="w-full md:max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items, categories, or swap preferences..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2 px-3 pr-10 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#4A0E67]"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#4A0E67] transition-colors"
              >
                <Search size={16} />
              </button>
            </div>
          </div>

          <div className="w-full md:w-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full md:w-auto bg-[#4A0E67] text-white text-sm py-2 px-3 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
            >
              <option value="all">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Furniture">Furniture</option>
              <option value="Computer">Computer</option>
              <option value="Phones">Phones</option>
              <option value="Clothing">Clothing</option>
              <option value="Cosmetics">Cosmetics</option>
              <option value="Automobiles">Automobiles</option>
              <option value="Shoes">Shoes</option>
              <option value="Jewelry">Jewelry</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Others">Others</option>
            </select>
          </div>
        </form>
      </div>
    </section>
  );
};

export default SearchBar;