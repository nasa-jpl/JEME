// src/data/citationTypeData.js
// Citation type data based on CSV analysis 

import colors from '../utils/colors';

const citationTypeData = [
  { name: 'Peer-Reviewed Journals', value: 63, percentage: 23.8, color: colors.primary },
  { name: 'Conference Papers', value: 28, percentage: 10.6, color: colors.secondary },
  { name: 'Academic Theses', value: 31, percentage: 11.7, color: colors.tertiary },
  { name: 'Technical Reports', value: 46, percentage: 17.4, color: colors.accent },
  { name: 'Online Resources', value: 92, percentage: 34.7, color: colors.warning },
  { name: 'Popular Press', value: 5, percentage: 1.9, color: colors.success }
];

export default citationTypeData;