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
  { name: 'TROPESS', path: '/science-model-dashboard/TROPESS' },
];

const NavBar = ({ activeItem }) => {
  const [modelsOpen, setModelsOpen] = useState(false);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const missionsDropdownRef = useRef(null);

  const isModelActive = MODEL_LINKS.some((m) => m.name === activeItem);
  const isMissionActive = MISSION_LINKS.some((m) => m.name === activeItem);
  const isJEOE = activeItem === 'JEOE Dashboard' || isMissionActive;

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

  // Update document title and favicon based on JEOE context
  useEffect(() => {
    const favicon = document.querySelector('link[rel="icon"]');
    if (isJEOE) {
      document.title = 'JEOE';
      if (favicon) favicon.href = '/science-model-dashboard/favicon-jeoe.svg';
    } else {
      document.title = 'JEME';
      if (favicon) favicon.href = '/science-model-dashboard/favicon.svg';
    }
  }, [isJEOE]);

  const linkBase = 'font-medium text-sm border-b-2 transition-colors';
  const activeClass = `${linkBase} text-blue-600 border-blue-600`;
  const inactiveClass = `${linkBase} text-gray-600 hover:text-gray-800 border-transparent`;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to={isJEOE ? "/science-model-dashboard/JEOE" : "/science-model-dashboard"} className="flex items-center gap-3">
          <img
            src={isJEOE ? "/science-model-dashboard/favicon-jeoe.svg" : "/science-model-dashboard/favicon.svg"}
            alt={isJEOE ? "JEOE" : "JEME"}
            className="h-10 w-10 rounded-md"
          />
          <div>
            <h1 className="text-lg font-semibold text-blue-900">{isJEOE ? 'JEOE Dashboard' : 'JEME Dashboard'}</h1>
            <p className="text-sm text-gray-600">{isJEOE ? "JPL Earth Observation Enterprise" : "JPL's Earth Modeling Enterprise"}</p>
          </div>
        </Link>

        <div className="flex gap-8 items-center">
          {isJEOE ? (
            <>
              <Link
                to="/science-model-dashboard/JEOE"
                className={activeItem === 'JEOE Dashboard' ? activeClass : inactiveClass}
              >
                JEOE
              </Link>

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

            </>
          ) : (
            <>
              <Link
                to="/science-model-dashboard"
                className={activeItem === 'Dashboard' ? activeClass : inactiveClass}
              >
                JEME
              </Link>

              {/* Models dropdown - placed before Earth System */}
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

              <Link
                to="/science-model-dashboard/earth-system"
                className={activeItem === 'Earth System' ? activeClass : inactiveClass}
              >
                Earth System
              </Link>


            </>
          )}

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
