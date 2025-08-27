// RAPID Dashboard
import React from 'react';
import GenericDashboard from '../GenericDashboard';
import citationsData from '../../data/RAPID_analyzed.json';

const RAPIDDashboard = () => {
  return <GenericDashboard modelName="RAPID" citationsData={citationsData} />;
};

export default RAPIDDashboard;