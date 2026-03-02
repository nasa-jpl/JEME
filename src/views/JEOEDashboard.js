// src/views/JEOEDashboard.js
// JEOE (JPL Earth Observation Enterprise) Dashboard - Missions only

import React, { useState, useEffect } from 'react';
import { Satellite, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

// Import chart components
import ModelComparisonChart from '../components/charts/ModelComparisonChart';
import MultiModelCitationTrendsChart from '../components/charts/MultiModelCitationTrendsChart';

const JEOEDashboard = () => {
  const [allMissionsData, setAllMissionsData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { loadAllModelsData } = await import('../utils/dataLoader');
        const missions = ['GRACE', 'SWOT'];
        const data = await loadAllModelsData(missions);
        setAllMissionsData(data);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load missions data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const missions = [
    {
      name: "GRACE",
      icon: <Satellite size={20} style={{ color: '#D946EF' }} />,
      description: "Gravity Recovery and Climate Experiment - Tracking changes in Earth's gravity field to monitor water storage, ice mass, and sea level",
      link: "/science-model-dashboard/GRACE"
    },
    {
      name: "SWOT",
      icon: <Satellite size={20} style={{ color: '#F59E0B' }} />,
      description: "Surface Water and Ocean Topography - Ka-band radar interferometry for water surface elevation measurements",
      link: "/science-model-dashboard/SWOT"
    }
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar activeItem="JEOE Dashboard" />

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* JEOE Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">JPL Earth Observation Enterprise (JEOE) Dashboard</h2>
            <p className="text-gray-600">
              Citation impact dashboard for NASA's mission-based Earth observation programs, tracking scientific publications and research influence
            </p>
          </div>

          {/* Mission Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missions.map((mission, index) => (
              <Link
                key={index}
                to={mission.link}
                className="group p-4 border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-sky-50 transition-colors">
                    {mission.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-sky-900 transition-colors">
                      {mission.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {mission.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Link to JEME */}
        <Link
          to="/science-model-dashboard"
          className="block bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 hover:bg-blue-100 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">JPL's Earth Modeling Enterprise (JEME)</h3>
              <p className="text-sm text-blue-700 mt-1">Explore 8 JPL science models for climate, hydrology, oceanography, and atmospheric research</p>
            </div>
            <ArrowRight size={20} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </Link>

        {loading ? (
          <div className="bg-white rounded-lg p-8 shadow-sm mb-6 text-center">
            <div className="text-gray-600">Loading mission data...</div>
          </div>
        ) : (
          <>
            {/* Mission Comparison Section */}
            <ModelComparisonChart allModelsData={allMissionsData} />

            {/* Citation trends across missions */}
            <MultiModelCitationTrendsChart allModelsData={allMissionsData} />
          </>
        )}

        <Footer isJEOE />
      </main>
    </div>
  );
};

export default JEOEDashboard;
