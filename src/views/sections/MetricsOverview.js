// src/views/sections/MetricsOverview.js
// Overview of key metrics section with real data from JSON

import React from 'react';
import { Award, TrendingUp, GitBranch, Droplet } from 'lucide-react';
import MetricCard from '../../components/MetricCard';

const MetricsOverview = () => (
  <div className="grid grid-cols-4 gap-4 mb-6">
    <MetricCard
      title="Total Citations"
      value="8,684"
      icon={<Award size={16} />}
      iconBg="bg-blue-400"
      trend="+12.3% from last quarter"
      trendUp={true}
      breakdown={[
        { label: "Peer-reviewed", value: "88" },
        { label: "High-impact (>100)", value: "17" },
        { label: "Recent (2020+)", value: "145" }
      ]}
    />
    <MetricCard
      title="H-Index"
      value="46"
      icon={<TrendingUp size={16} />}
      iconBg="bg-green-600"
      trend="+3.2 from last year"
      trendUp={true}
      breakdown={[
        { label: "Avg citations", value: "32.8" },
        { label: "Research impact", value: "High" }
      ]}
    />
    <MetricCard
      title="Implementation Rate"
      value="50.2%"
      icon={<GitBranch size={16} />}
      iconBg="bg-purple-600"
      trend="+4.7% from last quarter"
      trendUp={true}
      breakdown={[
        { label: "Model Adaptation", value: "106" },
        { label: "Foundational Method", value: "27" }
      ]}
    />
    <MetricCard
      title="Watersheds Modeled"
      value="41"
      icon={<Droplet size={16} />}
      iconBg="bg-teal-600"
      trend="+8 from last quarter"
      trendUp={true}
      breakdown={[
        { label: "North America", value: "25" },
        { label: "Other regions", value: "16" }
      ]}
    />
  </div>
);

export default MetricsOverview;