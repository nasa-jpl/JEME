// CMS-Flux Dashboard
import React from 'react';
import GenericDashboard from '../GenericDashboard';
import citationsData from '../../data/CMS-Flux_analyzed.json';

const CMSFluxDashboard = () => {
  return <GenericDashboard modelName="CMS-Flux" citationsData={citationsData} />;
};

export default CMSFluxDashboard;