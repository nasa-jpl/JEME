// src/data/domainData.js
// Research domains data based on keyword analysis from CSV

import colors from '../utils/colors';

const domainData = [
  { name: 'River Modeling', value: 114, percentage: 43, color: colors.primary },
  { name: 'Water Resources', value: 99, percentage: 37, color: colors.tertiary },
  { name: 'Flow Analysis', value: 86, percentage: 32, color: colors.secondary },
  { name: 'Flood Prediction', value: 80, percentage: 30, color: colors.accent },
  { name: 'Streamflow', value: 44, percentage: 17, color: colors.warning }
];

export default domainData;