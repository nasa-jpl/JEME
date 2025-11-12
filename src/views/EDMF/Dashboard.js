// EDMF Dashboard Component
import React, { useState, useEffect } from 'react';
import GenericDashboard from '../GenericDashboard';

const EDMFDashboard = () => {
  const [edmfData, setEdmfData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEDMFData = async () => {
      try {
        const edmfModule = await import('../../data/EDMF_analyzed.json');
        const data = edmfModule.default || edmfModule;
        setEdmfData(data);
      } catch (error) {
        console.error('Failed to load EDMF data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEDMFData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600">Loading EDMF data...</p>
        </div>
      </div>
    );
  }

  return <GenericDashboard modelName="EDMF" citationsData={edmfData} />;
};

export default EDMFDashboard;