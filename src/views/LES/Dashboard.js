// LES Dashboard Component
import React, { useState, useEffect } from 'react';
import GenericDashboard from '../GenericDashboard';

const LESDashboard = () => {
  const [lesData, setLesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLESData = async () => {
      try {
        const lesModule = await import('../../data/LES_analyzed.json');
        const data = lesModule.default || lesModule;
        setLesData(data);
      } catch (error) {
        console.error('Failed to load LES data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadLESData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading LES data...</p>
        </div>
      </div>
    );
  }

  return <GenericDashboard modelName="LES" citationsData={lesData} />;
};

export default LESDashboard;