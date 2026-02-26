import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

const MODEL_LINKS = [
  { name: 'RAPID', path: '/science-model-dashboard/RAPID' },
  { name: 'CMS-Flux', path: '/science-model-dashboard/CMS-Flux' },
  { name: 'ECCO', path: '/science-model-dashboard/ECCO' },
  { name: 'ISSM', path: '/science-model-dashboard/ISSM' },
  { name: 'MOMO-CHEM', path: '/science-model-dashboard/MOMO-CHEM' },
  { name: 'CARDAMOM', path: '/science-model-dashboard/CARDAMOM' },
  { name: 'LES', path: '/science-model-dashboard/LES' },
  { name: 'EDMF', path: '/science-model-dashboard/EDMF' },
];

const MISSION_LINKS = [
  { name: 'GRACE', path: '/science-model-dashboard/GRACE' },
  { name: 'SWOT', path: '/science-model-dashboard/SWOT' },
];

const NavBar = ({ activeItem }) => {
  const [modelsOpen, setModelsOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const missionsDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setModelsOpen(false);
      }
      if (missionsDropdownRef.current && !missionsDropdownRef.current.contains(e.target)) {
        setMissionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isModelActive = MODEL_LINKS.some((m) => m.name === activeItem);
  const isMissionActive = MISSION_LINKS.some((m) => m.name === activeItem);

  const linkBase = 'font-medium text-sm border-b-2 transition-colors';
  const activeClass = `${linkBase} text-blue-600 border-blue-600`;
  const inactiveClass = `${linkBase} text-gray-600 hover:text-gray-800 border-transparent`;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/science-model-dashboard" className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-400 rounded-md flex items-center justify-center text-white">
            <span className="font-bold">JEME</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-blue-900">JEME Dashboard</h1>
            <p className="text-sm text-gray-600">JPL's Earth Modeling Enterprise</p>
          </div>
        </Link>

        <div className="flex gap-8 items-center">
          <Link
            to="/science-model-dashboard"
            className={activeItem === 'Dashboard' ? activeClass : inactiveClass}
          >
            Dashboard
          </Link>

          {/* Models dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setModelsOpen(!modelsOpen)}
              className={`flex items-center gap-1 ${isModelActive ? activeClass : inactiveClass}`}
            >
              {isModelActive ? activeItem : 'Models'}
              <ChevronDown size={14} className={`transition-transform ${modelsOpen ? 'rotate-180' : ''}`} />
            </button>

            {modelsOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
                {MODEL_LINKS.map((model) => (
                  <Link
                    key={model.name}
                    to={model.path}
                    onClick={() => setModelsOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      activeItem === model.name
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {model.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Missions dropdown */}
          <div className="relative" ref={missionsDropdownRef}>
            <button
              onClick={() => setMissionsOpen(!missionsOpen)}
              className={`flex items-center gap-1 ${isMissionActive ? activeClass : inactiveClass}`}
            >
              {isMissionActive ? activeItem : 'Missions'}
              <ChevronDown size={14} className={`transition-transform ${missionsOpen ? 'rotate-180' : ''}`} />
            </button>

            {missionsOpen && (
              <div className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
                {MISSION_LINKS.map((mission) => (
                  <Link
                    key={mission.name}
                    to={mission.path}
                    onClick={() => setMissionsOpen(false)}
                    className={`block px-4 py-2 text-sm transition-colors ${
                      activeItem === mission.name
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {mission.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link
            to="/science-model-dashboard/how-it-works"
            className={activeItem === 'How It Works' ? activeClass : inactiveClass}
          >
            How It Works
          </Link>
        </div>
      </div>
    </header>
  );
};

export default NavBar;
