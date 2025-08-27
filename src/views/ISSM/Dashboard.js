// ISSM Dashboard
import React from 'react';
import GenericDashboard from '../GenericDashboard';
import citationsData from '../../data/ISSM_analyzed.json';

const ISSMDashboard = () => {
  return <GenericDashboard modelName="ISSM" citationsData={citationsData} />;
};

export default ISSMDashboard;