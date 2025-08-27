// MOMO-CHEM Dashboard
import React from 'react';
import GenericDashboard from '../GenericDashboard';
import citationsData from '../../data/MOMO-CHEM_analyzed.json';

const MOMOCHEMDashboard = () => {
  return <GenericDashboard modelName="MOMO-CHEM" citationsData={citationsData} />;
};

export default MOMOCHEMDashboard;