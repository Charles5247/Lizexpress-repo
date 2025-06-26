import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Item } from '../lib/supabase';

const ProductCategories: React.FC = () => {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  const slidesPerView = {
    sm: 2,
    md: 3,
    lg: 5
  };

  useEffect(() => {
    fetchRecentItems();
  }, []);

  const fetchRecentItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select(`
          *,
          users!inner(id, full_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const totalSlides = Math.ceil(items.length / slidesPerView.lg);
  
  const nextSlide = () => {
    setActiveSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };
  
  const prevSlide = () => {
    setActiveSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };
  
  const goToSlide = (index: number) => {
    setActiveSlide(index);
  };

  // Calculate visible items based on active slide and screen size
  const visibleItems = items.slice(
    activeSlide * slidesPerView.lg, 
    (activeSlide + 1) * slidesPerView.lg
  );

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#4A0E67] border-t-transparent"></div>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <Search size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Items Available Yet</h3>
            <p className="text-gray-500 mb-6">Be the first to list an item for swapping!</p>
            <button
              onClick={() => navigate('/list-item')}
              className="bg-[#F7941D] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#e68a1c] transition-colors"
            >
              List Your First Item
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#4A0E67]">Recent Items</h2>
          <button
            onClick={() => navigate('/browse')}
            className="text-[#F7941D] hover:underline font-semibold"
          >
            View All →
          </button>
        </div>

        <div className="relative">
          {/* Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibleItems.map((item) => (
              <div 
                key={item.id} 
                className="flex flex-col items-center p-2 transition-transform hover:scale-105 cursor-pointer"
                onClick={() => navigate(`/items/${item.id}`)}
              >
                <div className="bg-gray-100 p-2 rounded-lg mb-2 w-full flex justify-center items-center" style={{ height: '120px' }}>
                  <img 
                    src={item.images[0]} 
                    alt={item.name} 
                    className="h-auto max-w-full max-h-full object-contain"
                  />
                </div>
                <h3 className="text-center font-semibold text-sm">{item.name}</h3>
                <p className="text-[#4A0E67] text-xs text-center">
                  {item.condition} • {item.category}
                </p>
                <p className="text-[#F7941D] text-xs text-center font-medium">
                  Swap for: {item.swap_for}
                </p>
              </div>
            ))}
          </div>
          
          {/* Navigation Arrows */}
          {totalSlides > 1 && (
            <>
              <button
                className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white rounded-full p-1 shadow-md hidden md:block"
                onClick={prevSlide}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white rounded-full p-1 shadow-md hidden md:block"
                onClick={nextSlide}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}
        </div>
        
        {/* Pagination Dots */}
        {totalSlides > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                className={`h-2 w-2 rounded-full ${
                  index === activeSlide ? 'bg-[#F7941D]' : 'bg-gray-300'
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductCategories;