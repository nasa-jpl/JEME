// ECCO Dashboard
import React from 'react';
import GenericDashboard from '../GenericDashboard';
import citationsData from '../../data/ECCO_analyzed.json';

const ECCODashboard = () => {
  return <GenericDashboard modelName="ECCO" citationsData={citationsData} />;
};

export default ECCODashboard;