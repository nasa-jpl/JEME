import React from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ComposedChart } from 'recharts';
import { ChevronRight, Download, Filter, Calendar, Settings, Bell, Search, ExternalLink, MoreHorizontal, Expand, Award, TrendingUp, GitBranch, Droplet } from 'lucide-react';

const colors = {
  primary: '#1976d2',
  primaryLight: '#42a5f5',
  primaryDark: '#0d47a1',
  secondary: '#388e3c',
  tertiary: '#7c3aed',
  accent: '#0097a7',
  warning: '#f57c00',
  danger: '#d32f2f',
  success: '#2e7d32',
  gray100: '#f3f4f6',
  gray200: '#e5e7eb',
  gray300: '#d1d5db',
  gray400: '#9ca3af',
  gray500: '#6b7280',
  gray600: '#4b5563',
  gray700: '#374151',
  gray800: '#1f2937',
  gray900: '#111827',
};

// Annual citation data
const citationData = [
  { year: 2011, annual: 2, cumulative: 2, peerReviewed: 0, other: 2, growthRate: null },
  { year: 2012, annual: 5, cumulative: 7, peerReviewed: 1, other: 4, growthRate: 150 },
  { year: 2013, annual: 7, cumulative: 14, peerReviewed: 1, other: 6, growthRate: 40 },
  { year: 2014, annual: 9, cumulative: 23, peerReviewed: 1, other: 8, growthRate: 29 },
  { year: 2015, annual: 12, cumulative: 35, peerReviewed: 1, other: 11, growthRate: 33 },
  { year: 2016, annual: 14, cumulative: 49, peerReviewed: 1, other: 13, growthRate: 17 },
  { year: 2017, annual: 17, cumulative: 66, peerReviewed: 2, other: 15, growthRate: 21 },
  { year: 2018, annual: 20, cumulative: 86, peerReviewed: 1, other: 19, growthRate: 18 },
  { year: 2019, annual: 23, cumulative: 109, peerReviewed: 2, other: 21, growthRate: 15 },
  { year: 2020, annual: 26, cumulative: 135, peerReviewed: 1, other: 25, growthRate: 13 },
  { year: 2021, annual: 29, cumulative: 164, peerReviewed: 2, other: 27, growthRate: 12 },
  { year: 2022, annual: 28, cumulative: 192, peerReviewed: 1, other: 27, growthRate: -3 },
  { year: 2023, annual: 31, cumulative: 223, peerReviewed: 2, other: 29, growthRate: 11 },
  { year: 2024, annual: 30, cumulative: 253, peerReviewed: 1, other: 29, growthRate: -3 },
  { year: 2025, annual: 6, cumulative: 259, peerReviewed: 0, other: 6, growthRate: null }
];

// Model comparison data
const modelData = [
  { name: 'RAPID', citations: 259, impactScore: 14.8, year: 2011, color: colors.primary },
  { name: 'LISFLOOD', citations: 312, impactScore: 16.2, year: 2007, color: colors.secondary },
  { name: 'TOPMODEL', citations: 487, impactScore: 23.5, year: 1995, color: colors.tertiary },
  { name: 'HEC-RAS', citations: 394, impactScore: 19.3, year: 2002, color: colors.accent },
  { name: 'VIC', citations: 581, impactScore: 26.8, year: 1994, color: colors.warning }
];

// Citation type data
const citationTypeData = [
  { name: 'Peer-Reviewed Journals', value: 17, percentage: 6.6, color: colors.primary },
  { name: 'Conference Papers', value: 22, percentage: 8.5, color: colors.secondary },
  { name: 'Academic Theses', value: 38, percentage: 14.7, color: colors.tertiary },
  { name: 'Technical Reports', value: 52, percentage: 20.1, color: colors.accent },
  { name: 'Online Resources', value: 125, percentage: 48.3, color: colors.warning },
  { name: 'Popular Press', value: 5, percentage: 1.9, color: colors.success }
];

// Research domains data
const domainData = [
  { name: 'Hydrology', value: 104, percentage: 40, color: colors.primary },
  { name: 'Water Resources', value: 70, percentage: 27, color: colors.tertiary },
  { name: 'Climate Science', value: 39, percentage: 15, color: colors.secondary },
  { name: 'Flood Prediction', value: 26, percentage: 10, color: colors.accent },
  { name: 'Computer Science', value: 20, percentage: 8, color: colors.warning }
];

// Engagement level data
const engagementData = [
  { name: 'Level 1: Simple Citation', value: 175, color: colors.primaryLight },
  { name: 'Level 2: Data Usage', value: 50, color: colors.secondary },
  { name: 'Level 3: Model Adaptation', value: 22, color: colors.tertiary },
  { name: 'Level 4: Foundation', value: 12, color: colors.accent }
];

// Future trends data
const trendData = [
  { year: 2020, actual: 135, projected: null, optimistic: null, conservative: null },
  { year: 2021, actual: 164, projected: null, optimistic: null, conservative: null },
  { year: 2022, actual: 192, projected: null, optimistic: null, conservative: null },
  { year: 2023, actual: 223, projected: null, optimistic: null, conservative: null },
  { year: 2024, actual: 253, projected: null, optimistic: null, conservative: null },
  { year: 2025, actual: 259, projected: 280, optimistic: 295, conservative: 270 },
  { year: 2026, actual: null, projected: 310, optimistic: 335, conservative: 290 },
  { year: 2027, actual: null, projected: 345, optimistic: 380, conservative: 315 },
  { year: 2028, actual: null, projected: 385, optimistic: 435, conservative: 350 },
  { year: 2029, actual: null, projected: 430, optimistic: 495, conservative: 385 },
  { year: 2030, actual: null, projected: 480, optimistic: 560, conservative: 425 }
];

// Journal distribution data
const journalData = [
  { name: 'Journal of Hydrology', count: 4 },
  { name: 'Water Resources Research', count: 3 },
  { name: 'Journal of Hydrometeorology', count: 3 },
  { name: 'Environmental Modelling & Software', count: 2 },
  { name: 'Hydrology and Earth System Sciences', count: 2 },
  { name: 'Computers & Geosciences', count: 1 },
  { name: 'Journal of Geophysical Research', count: 1 },
  { name: 'Water', count: 1 }
];

// GitHub repository metrics data
const githubData = [
  { metric: 'Stars', value: 156 },
  { metric: 'Forks', value: 54 },
  { metric: 'Contributors', value: 12 },
  { metric: 'Open Issues', value: 45 },
  { metric: 'Code Coverage', value: '78%' },
  { metric: 'Downloads', value: '1.2K' },
  { metric: 'Releases', value: 8 },
  { metric: 'Commits', value: 924 }
];

const PaperInfo = () => (
  <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
    <div className="font-semibold text-blue-900 mb-2">River network routing on the NHDPlus dataset</div>
    <div className="text-sm text-gray-700 mb-2">Cédric H. David, David R. Maidment, Guo-Yue Niu, Zong-Liang Yang, Florence Habets, Victor Eijkhout</div>
    <div className="text-xs text-gray-600">Journal of Hydrometeorology (2011), Volume 12, Issue 5, Pages 913-934</div>
    <div className="text-xs text-blue-600 mt-2">DOI: <a href="#" className="hover:underline">10.1175/2011JHM1345.1</a></div>
  </div>
);

const Header = () => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h2 className="text-xl font-semibold text-gray-900">RAPID Model Citation Impact</h2>
      <div className="text-sm text-gray-500">Last updated: April 11, 2025</div>
    </div>
    <div className="flex gap-3">
      <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100">
        <Filter size={16} />
        <span>Filter</span>
      </button>
      <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-100">
        <Calendar size={16} />
        <span>Date Range</span>
      </button>
      <button className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-600 text-sm font-medium text-white hover:bg-blue-700">
        <Download size={16} />
        <span>Export Report</span>
      </button>
    </div>
  </div>
);

const Tabs = () => (
  <div className="flex border-b border-gray-200 mb-6">
    <div className="px-6 py-3 text-sm font-medium text-blue-600 border-b-2 border-blue-600">Overview</div>
    <div className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Citation Analysis</div>
    <div className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Geographic Impact</div>
    <div className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Research Domains</div>
    <div className="px-6 py-3 text-sm font-medium text-gray-600 hover:text-gray-800 hover:border-b-2 hover:border-gray-300">Model Extensions</div>
  </div>
);

const MetricCard = ({ title, value, icon, iconBg, trend, trendUp, breakdown }) => (
  <div className="bg-white rounded-lg p-5 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="text-sm font-medium text-gray-500">{title}</div>
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${iconBg}`}>
        {icon}
      </div>
    </div>
    <div className="text-2xl font-semibold text-gray-900">{value}</div>
    <div className={`flex items-center gap-2 mt-2 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
      {trendUp ? <TrendingUp size={14} /> : <TrendingUp size={14} className="rotate-180" />}
      <span>{trend}</span>
    </div>
    <div className="mt-2 text-xs text-gray-600">
      {breakdown.map((item, index) => (
        <div key={index} className="flex justify-between mt-1">
          <span className="text-gray-500">{item.label}:</span>
          <span className="font-medium text-gray-700">{item.value}</span>
        </div>
      ))}
    </div>
  </div>
);

const MetricsOverview = () => (
  <div className="grid grid-cols-4 gap-4 mb-6">
    <MetricCard
      title="Total Citations"
      value="259"
      icon={<Award size={16} />}
      iconBg="bg-blue-400"
      trend="+8.3% from last quarter"
      trendUp={true}
      breakdown={[
        { label: "Peer-reviewed", value: "17" },
        { label: "Popular press", value: "5" },
        { label: "Other sources", value: "237" }
      ]}
    />
    <MetricCard
      title="Impact Score"
      value="14.8"
      icon={<TrendingUp size={16} />}
      iconBg="bg-green-600"
      trend="+1.2 from last year"
      trendUp={true}
      breakdown={[
        { label: "Citation quality", value: "Medium" },
        { label: "Field influence", value: "High" }
      ]}
    />
    <MetricCard
      title="Implementation Rate"
      value="32.4%"
      icon={<GitBranch size={16} />}
      iconBg="bg-purple-600"
      trend="+2.1% from last quarter"
      trendUp={true}
      breakdown={[
        { label: "Used methodology", value: "67" },
        { label: "Extended model", value: "17" }
      ]}
    />
    <MetricCard
      title="Watersheds Modeled"
      value="42"
      icon={<Droplet size={16} />}
      iconBg="bg-teal-600"
      trend="+3 from last quarter"
      trendUp={true}
      breakdown={[
        { label: "North America", value: "26" },
        { label: "Other regions", value: "16" }
      ]}
    />
  </div>
);

const CitationTrendsChart = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Citation Trends Over Time</div>
        <div className="text-sm text-gray-500 mt-1">Annual and cumulative citations from 2011 to 2025</div>
      </div>
      <div className="flex gap-2">
        <button className="text-gray-500 hover:text-gray-700 p-1"><Expand size={18} /></button>
        <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
      </div>
    </div>
    
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={citationData}
          margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="year" />
          <YAxis yAxisId="left" orientation="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="annual" name="Annual Citations" fill={colors.primaryLight} barSize={30} />
          <Line yAxisId="right" type="monotone" dataKey="cumulative" name="Cumulative Citations" stroke={colors.accent} strokeWidth={2} />
          <Area yAxisId="right" type="monotone" dataKey="cumulative" fill={colors.accent} fillOpacity={0.1} stroke="none" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    
    <div className="flex flex-wrap gap-6 mt-4">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-blue-400"></div>
        <span className="text-xs text-gray-600">Annual Citations</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-teal-600"></div>
        <span className="text-xs text-gray-600">Cumulative Citations (259)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-green-600"></div>
        <span className="text-xs text-gray-600">Peer-Reviewed Papers (17)</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded bg-orange-500"></div>
        <span className="text-xs text-gray-600">Popular Press (5)</span>
      </div>
    </div>
  </div>
);

const ScoreCalculation = ({ title, items }) => (
  <div className="bg-gray-100 rounded-lg p-4 mt-4">
    <div className="text-sm font-semibold text-gray-700 mb-2">{title}</div>
    {items.map((item, index) => (
      <div key={index} className={`flex justify-between py-1 text-xs text-gray-600 ${index < items.length - 1 ? 'border-b border-dashed border-gray-200' : ''} ${index === items.length - 1 ? 'font-semibold text-gray-800 mt-2' : ''}`}>
        <div>{item.factor}</div>
        {item.weight && <div className="text-center text-gray-500">{item.weight}</div>}
        <div className="text-right font-medium">{item.score}</div>
      </div>
    ))}
  </div>
);

const ImpactScoreCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Impact Score Calculation</div>
        <div className="text-sm text-gray-500 mt-1">How the 14.8 impact score is derived</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <ScoreCalculation 
      title="Citation Quality Component"
      items={[
        { factor: "Peer-reviewed journals (17)", weight: "×3.0", score: "51.0" },
        { factor: "Conference papers (22)", weight: "×1.5", score: "33.0" },
        { factor: "Technical reports (52)", weight: "×0.8", score: "41.6" },
        { factor: "Academic theses (38)", weight: "×0.7", score: "26.6" },
        { factor: "Online resources (125)", weight: "×0.1", score: "12.5" },
        { factor: "Popular press (5)", weight: "×0.4", score: "2.0" }
      ]}
    />
    
    <ScoreCalculation 
      title="Engagement Depth Multipliers"
      items={[
        { factor: "Level 4 citations (12)", weight: "×2.0", score: "+24.0" },
        { factor: "Level 3 citations (22)", weight: "×1.5", score: "+33.0" },
        { factor: "Level 2 citations (50)", weight: "×1.2", score: "+60.0" }
      ]}
    />
    
    <ScoreCalculation 
      title="Field Impact & Recency"
      items={[
        { factor: "High-impact journals", weight: "×1.5", score: "+12.6" },
        { factor: "Recent citations (2 years)", weight: "×1.3", score: "+21.8" },
        { factor: "Raw score ÷ 20", weight: "", score: "14.8" }
      ]}
    />
  </div>
);

const ResearchDomainsCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Research Domains</div>
        <div className="text-sm text-gray-500 mt-1">Distribution across fields</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <div className="h-56 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={domainData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({cx, cy, midAngle, innerRadius, outerRadius, percent}) => {
              const radius = innerRadius + (outerRadius - innerRadius) * 1.3;
              const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
              const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
              return percent > 0.1 ? (
                <text x={x} y={y} fill={colors.gray700} textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight={500}>
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              ) : null;
            }}
          >
            {domainData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} papers`, 'Count']} />
        </PieChart>
      </ResponsiveContainer>
    </div>
    
    <div className="space-y-3">
      {domainData.map((item, index) => (
        <div key={index} className="flex items-center">
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">{item.name}</div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${item.percentage}%`, backgroundColor: item.color }}></div>
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-700 ml-4 w-10 text-right">{item.value}</div>
        </div>
      ))}
    </div>
  </div>
);

const EngagementLevelsCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Engagement Level Distribution</div>
        <div className="text-sm text-gray-500 mt-1">How deeply is RAPID being utilized in research?</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <div className="h-64 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={engagementData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 90, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => [`${value} papers`, 'Count']} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {engagementData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    
    <div className="bg-gray-100 rounded-lg p-4">
      <div className="text-sm font-semibold text-gray-700 mb-2">Engagement Level Definitions</div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between py-1 border-b border-dashed border-gray-200">
          <div>Level 1: Simple Citation</div>
          <div>References the paper without using the model</div>
        </div>
        <div className="flex justify-between py-1 border-b border-dashed border-gray-200">
          <div>Level 2: Data Usage</div>
          <div>Uses RAPID methodology or data</div>
        </div>
        <div className="flex justify-between py-1 border-b border-dashed border-gray-200">
          <div>Level 3: Model Adaptation</div>
          <div>Modifies or extends the RAPID model</div>
        </div>
        <div className="flex justify-between py-1">
          <div>Level 4: Foundation</div>
          <div>RAPID is foundational to the research</div>
        </div>
      </div>
    </div>
  </div>
);

const CitationTypeCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Citation Type Breakdown</div>
        <div className="text-sm text-gray-500 mt-1">Publication venues citing RAPID</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <div className="h-64 mb-4 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={citationTypeData}
            cx="50%"
            cy="50%"
            innerRadius={35}
            outerRadius={90}
            fill="#8884d8"
            paddingAngle={1}
            dataKey="value"
          >
            {citationTypeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value} (${citationTypeData.find(item => item.name === name).percentage}%)`, name]} />
          <Legend layout="vertical" verticalAlign="middle" align="right" />
        </PieChart>
      </ResponsiveContainer>
    </div>
    
    <div className="text-center">
      <div className="text-3xl font-semibold text-gray-900 mb-1">259</div>
      <div className="text-sm text-gray-500">Total Citations</div>
    </div>
  </div>
);

const ModelComparisonChart = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Comparative Impact Assessment</div>
        <div className="text-sm text-gray-500 mt-1">RAPID model compared to similar hydrological models</div>
      </div>
      <div className="flex gap-2">
        <button className="text-gray-500 hover:text-gray-700 p-1"><Expand size={18} /></button>
        <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
      </div>
    </div>
    
    <div className="flex">
      <div className="flex-3">
        <div className="h-80 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={modelData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis yAxisId="left" orientation="left" label={{ value: 'Total Citations', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" label={{ value: 'Impact Score', angle: 90, position: 'insideRight' }} />
              <Tooltip formatter={(value, name, props) => {
                if (name === 'citations') return [`${value} citations`, 'Citations'];
                if (name === 'impactScore') return [`${value} impact score`, 'Impact Score'];
                return [value, name];
              }} />
              <Legend />
              <Bar yAxisId="left" dataKey="citations" name="Total Citations" fill={(data) => data.color} />
              <Line yAxisId="right" type="monotone" dataKey="impactScore" name="Impact Score" stroke="#ff7300" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-wrap gap-6 mt-4">
          {modelData.map((model, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: model.color }}></div>
              <span className="text-xs text-gray-600">{model.name} ({model.citations} citations)</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-2 pl-8 border-l border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-4">Comparative Analysis</div>
        
        <div className="text-xs text-gray-600 mb-2">
          The chart compares RAPID to other widely used hydrological models. For each model, the bars show total citations and the line shows impact score.
        </div>
        
        <div className="bg-gray-100 rounded-lg p-3 mt-4">
          <div className="text-xs text-gray-600 font-medium mb-2">Analysis Factors</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <div className="text-gray-600">Model Age</div>
              <div className="text-gray-700">Older models tend to accumulate more citations</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600">Citation-to-Age Ratio</div>
              <div className="text-gray-700">RAPID: 18.5 citations/year</div>
            </div>
            <div className="flex justify-between">
              <div className="text-gray-600">Average for Comparison</div>
              <div className="text-gray-700">21.3 citations/year</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="text-xs text-gray-700 font-medium mb-2">RAPID's strengths:</div>
          <ul className="text-xs text-gray-600 pl-6 list-disc space-y-1">
            <li>Excellent performance for large-scale applications</li>
            <li>Integration with NHDPlus dataset</li>
            <li>Parallel computing capabilities</li>
            <li>Strong growth in recent years</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

const FutureTrendsChart = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Future Trends & Predictions</div>
        <div className="text-sm text-gray-500 mt-1">Projected growth and emerging research areas</div>
      </div>
      <div className="flex gap-2">
        <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
      </div>
    </div>
    
    <div className="flex">
      <div className="flex-1 pr-6">
        <div className="text-sm font-semibold text-gray-800 mb-3">Citation Projection (2025-2030)</div>
        <div className="h-64 bg-gray-100 rounded-lg p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={trendData}
              margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="actual" name="Historical Data" stroke={colors.primary} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="projected" name="Projected Growth" stroke={colors.primary} strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="optimistic" name="Optimistic" stroke={colors.success} strokeWidth={1} strokeDasharray="3 3" />
              <Line type="monotone" dataKey="conservative" name="Conservative" stroke={colors.warning} strokeWidth={1} strokeDasharray="3 3" />
              <Area type="monotone" dataKey="projected" fill={colors.primary} fillOpacity={0.1} stroke="none" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex flex-wrap gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-blue-500"></div>
            <span className="text-xs text-gray-600">Historical Data</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-t-2 border-dashed border-blue-500"></div>
            <span className="text-xs text-gray-600">Projected Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-t border-dotted border-green-600"></div>
            <span className="text-xs text-gray-600">Optimistic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 border-t border-dotted border-orange-500"></div>
            <span className="text-xs text-gray-600">Conservative</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 pl-6 border-l border-gray-200">
        <div className="text-sm font-semibold text-gray-800 mb-3">Emerging Research Directions</div>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Machine Learning Integration</div>
              <div className="text-gray-800 font-medium">Trending ↑</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Climate Change Applications</div>
              <div className="text-gray-800 font-medium">Strong ↑↑</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Urban Flood Modeling</div>
              <div className="text-gray-800 font-medium">Emerging ↗</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Watershed Management</div>
              <div className="text-gray-800 font-medium">Steady →</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Water Quality Integration</div>
              <div className="text-gray-800 font-medium">Growing ↑</div>
            </div>
          </div>
        </div>
        
        <div className="text-sm font-semibold text-gray-800 mt-6 mb-3">Potential Growth Drivers</div>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Increased extreme weather events</div>
              <div className="text-gray-800 font-medium">+23% citations</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Advancing GPU compute capabilities</div>
              <div className="text-gray-800 font-medium">+18% citations</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">New global hydrological datasets</div>
              <div className="text-gray-800 font-medium">+15% citations</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Water resource policy integration</div>
              <div className="text-gray-800 font-medium">+12% citations</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const DashboardSummaryCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Dashboard Summary</div>
        <div className="text-sm text-gray-500 mt-1">Key insights and metrics at a glance</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1">
        <Download size={18} />
      </button>
    </div>
    
    <div className="flex">
      <div className="flex-1 pr-6">
        <div className="text-sm font-semibold text-gray-800 mb-3">Citation Summary</div>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Total Citations</div>
              <div className="text-gray-800 font-medium">259</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Average Annual Growth</div>
              <div className="text-gray-800 font-medium">19.3 citations/year</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Current Year-to-Date</div>
              <div className="text-gray-800 font-medium">6 citations (Q1 2025)</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Peak Citation Year</div>
              <div className="text-gray-800 font-medium">2023 (31 citations)</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Citation Quality Index</div>
              <div className="text-gray-800 font-medium">Medium-High</div>
            </div>
          </div>
        </div>
        
        <div className="text-sm font-semibold text-gray-800 mt-6 mb-3">Research Impact</div>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Implementation Score</div>
              <div className="text-gray-800 font-medium">32.4%</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">High-Engagement Citations</div>
              <div className="text-gray-800 font-medium">34 papers (Levels 3-4)</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Geographic Reach</div>
              <div className="text-gray-800 font-medium">42 watersheds in 15 countries</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Educational Impact</div>
              <div className="text-gray-800 font-medium">38 academic theses</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 pl-6 border-l border-gray-200">
        <div className="text-sm font-semibold text-gray-800 mb-3">Domain Impact</div>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Primary Domain</div>
              <div className="text-gray-800 font-medium">Hydrology (104 papers)</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Cross-Disciplinary Reach</div>
              <div className="text-gray-800 font-medium">5 major research domains</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Model Extensions</div>
              <div className="text-gray-800 font-medium">4 major adaptations</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Research Focus Areas</div>
              <div className="text-gray-800 font-medium">Flood prediction, Climate modeling</div>
            </div>
          </div>
        </div>
        
        <div className="text-sm font-semibold text-gray-800 mt-6 mb-3">Recommendations</div>
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Monitor</div>
              <div className="text-gray-800 font-medium">Machine learning integration</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Highlight</div>
              <div className="text-gray-800 font-medium">Climate science applications</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Explore</div>
              <div className="text-gray-800 font-medium">Water quality modeling integration</div>
            </div>
            <div className="flex justify-between text-sm">
              <div className="text-gray-600">Showcase</div>
              <div className="text-gray-800 font-medium">GPU acceleration capabilities</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const JournalDistributionCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Journal Distribution</div>
        <div className="text-sm text-gray-500 mt-1">Top journals citing RAPID</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <div className="space-y-2">
      {journalData.map((journal, index) => (
        <div key={index} className="flex justify-between items-center p-2 border-b border-gray-200">
          <div className="text-sm text-gray-700">{journal.name}</div>
          <div className="text-sm font-semibold text-gray-800">{journal.count}</div>
        </div>
      ))}
    </div>
    
    <div className="bg-gray-100 rounded-lg p-4 mt-4">
      <div className="text-sm font-semibold text-gray-700 mb-2">Journal Impact Analysis</div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-600">
          <div>High-impact journals (IF {'>'} 4)</div>
          <div className="font-medium">7 citations</div>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <div>Medium-impact journals</div>
          <div className="font-medium">8 citations</div>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <div>Specialized journals</div>
          <div className="font-medium">2 citations</div>
        </div>
      </div>
    </div>
  </div>
);

const GitHubMetricsCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">GitHub Repository Metrics</div>
        <div className="text-sm text-gray-500 mt-1">c-h-david/rapid</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><ExternalLink size={18} /></button>
    </div>
    
    <div className="grid grid-cols-4 gap-4 mb-6">
      {githubData.map((metric, index) => (
        <div key={index} className="p-3 bg-gray-100 rounded-lg text-center">
          <div className="text-lg font-semibold text-gray-900">{metric.value}</div>
          <div className="text-xs text-gray-500">{metric.metric}</div>
        </div>
      ))}
    </div>
    
    <div className="h-40 bg-gray-100 rounded-lg p-4 mt-4 relative">
      <div className="text-xs text-gray-700 font-medium mb-2">Commit Activity (Last 12 Months)</div>
      <div className="flex items-end h-24 px-2">
        <div className="flex-1 h-8 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-5 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-10 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-4 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-14 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-12 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-6 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-16 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-9 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-11 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-20 bg-blue-200 mx-px rounded-t"></div>
        <div className="flex-1 h-10 bg-blue-200 mx-px rounded-t"></div>
      </div>
    </div>
  </div>
);

const Footer = () => (
  <div className="text-center py-6 text-sm text-gray-500 border-t border-gray-200 mt-8">
    <div>© 2025 RAPID Citation Dashboard | River Application for Parallel computation of Discharge</div>
    <div className="mt-2">Data sources: Google Scholar, Web of Science, Scopus, GitHub | Last updated: April 11, 2025</div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-400 rounded-md flex items-center justify-center text-white">
              <span className="font-bold">R</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-blue-900">RAPID Citation Dashboard</h1>
              <div className="text-xs text-gray-500">River Application for Parallel computation of Discharge</div>
            </div>
          </div>
          
          <div className="flex gap-8">
            <a href="#" className="text-blue-600 border-b-2 border-blue-600 font-medium text-sm">Dashboard</a>
            <a href="#" className="text-gray-600 hover:text-gray-800 font-medium text-sm">Citation Analytics</a>
            <a href="#" className="text-gray-600 hover:text-gray-800 font-medium text-sm">Geographic Impact</a>
            <a href="#" className="text-gray-600 hover:text-gray-800 font-medium text-sm">Model Evolution</a>
            <a href="#" className="text-gray-600 hover:text-gray-800 font-medium text-sm">Reports</a>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-500" />
              </div>
              <input type="text" placeholder="Search citations..." className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
            <button className="text-gray-600 hover:text-gray-800">
              <Bell size={20} />
            </button>
            <button className="text-gray-600 hover:text-gray-800">
              <Settings size={20} />
            </button>
            <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-semibold">
              A
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6">
        <PaperInfo />
        <Header />
        <Tabs />
        <MetricsOverview />
        <CitationTrendsChart />
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <ImpactScoreCard />
          <ResearchDomainsCard />
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <EngagementLevelsCard />
          <CitationTypeCard />
        </div>
        
        <ModelComparisonChart />
        <FutureTrendsChart />
        <DashboardSummaryCard />
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <JournalDistributionCard />
          <GitHubMetricsCard />
        </div>
        
        <Footer />
      </main>
    </div>
  );
};

export default Dashboard;