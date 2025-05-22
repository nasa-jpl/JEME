// src/views/sections/MetricsOverview.js
// Overview of key metrics section

import React from 'react';
import { Award, TrendingUp, GitBranch, Droplet } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const MetricsOverview = () => (
  <div className="grid grid-cols-4 gap-4 mb-6">
    <MetricCard
      title="Total Citations"
      value="265"
      icon={<Award size={16} />}
      iconBg="bg-blue-400"
      trend="+6.5% from last quarter"
      trendUp={true}
      breakdown={[
        { label: "Peer-reviewed", value: "63" },
        { label: "Popular press", value: "5" },
        { label: "Other sources", value: "197" }
      ]}
    />
    <MetricCard
      title="Impact Score"
      value="15.2"
      icon={<TrendingUp size={16} />}
      iconBg="bg-green-600"
      trend="+1.4 from last year"
      trendUp={true}
      breakdown={[
        { label: "Citation quality", value: "Medium-High" },
        { label: "Field influence", value: "High" }
      ]}
    />
    <MetricCard
      title="Implementation Rate"
      value="34.7%"
      icon={<GitBranch size={16} />}
      iconBg="bg-purple-600"
      trend="+2.3% from last quarter"
      trendUp={true}
      breakdown={[
        { label: "Used methodology", value: "78" },
        { label: "Extended model", value: "40" }
      ]}
    />
    <MetricCard
      title="Watersheds Modeled"
      value="48"
      icon={<Droplet size={16} />}
      iconBg="bg-teal-600"
      trend="+6 from last quarter"
      trendUp={true}
      breakdown={[
        { label: "North America", value: "31" },
        { label: "Other regions", value: "17" }
      ]}
    />
  </div>
);

export default MetricsOverview;