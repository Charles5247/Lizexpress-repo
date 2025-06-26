import React from 'react'; 
import { useNavigate } from 'react-router-dom';

const CallToAction: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
          <p className="text-lg md:text-xl font-medium text-center md:text-left break-words max-w-xs mx-auto md:max-w-full">
            Will you like to get what you want with what you have, <br className="hidden md:inline" />
            spending little or <span className="whitespace-nowrap">NO CASH???</span>
          </p>

          </div>

          <div>
            <button 
              onClick={() => navigate('/list-item')}
              className="bg-[#F7941D] text-white font-bold py-2 px-6 rounded hover:bg-[#e68a1c] transition-colors"
            >
              CLICK HERE NOW!
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
