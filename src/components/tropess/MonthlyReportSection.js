// src/components/tropess/MonthlyReportSection.js
// TROPESS "Monthly Download Report" section.
//
// Renders slides 3-7 of the GES DISC TROPESS_Data_Download_Metrics deck from
// the aggregated data produced by scripts/build_tropess_downloads.py.
// Data is fetched once from public/data/TROPESS_downloads.json.

import React, { useEffect, useMemo, useState } from 'react';
import {
  ComposedChart, LineChart, BarChart, Bar, Line, Cell, ReferenceLine, LabelList,
  PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Download, Database, Globe, Layers, Building2 } from 'lucide-react';
import CountryVolumeMap from './CountryVolumeMap';

// Compact file-count formatter: 1.2M, 340K, 512.
const formatFiles = (n) => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return `${n}`;
};

// --- Palette (categorical, light-mode safe) --------------------------------
const SPECIES_COLORS = {
  CO: '#3B82F6',
  CH4: '#EF4444',
  HDO: '#10B981',
  NH3: '#F59E0B',
  O3: '#8B5CF6',
  PAN: '#EC4899',
};

const CATEGORICAL = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#06B6D4', '#F97316', '#EC4899', '#84CC16', '#6366F1',
  '#14B8A6', '#F472B6', '#EAB308', '#22C55E', '#A855F7',
];

const TYPE_COLORS = {
  Forward: '#3B82F6',
  Reanalysis: '#10B981',
  Special: '#F59E0B',
};

const TYPE_DESCRIPTIONS = [
  { type: 'Forward', desc: 'Low-latency products' },
  { type: 'Reanalysis', desc: 'Long-term, global records' },
  { type: 'Special', desc: 'Regional records (megacities, fires)' },
];

const TIMESERIES_SPECIES = ['CO', 'CH4', 'HDO', 'NH3', 'O3', 'PAN'];

// Format "YYYY-MM" -> "Mon YY" for compact axis labels.
const formatMonth = (m) => {
  if (!m) return '';
  const [y, mm] = m.split('-');
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${names[parseInt(mm, 10) - 1]} ${y.slice(2)}`;
};

const formatMonthLong = (m) => {
  if (!m) return '';
  const [y, mm] = m.split('-');
  const names = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `${names[parseInt(mm, 10) - 1]} ${y}`;
};

// --- Reusable card shell ---------------------------------------------------
const Card = ({ title, subtitle, icon, children, className = '' }) => (
  <div className={`bg-white rounded-lg p-5 shadow-sm ${className}`}>
    <div className="flex items-start justify-between mb-4">
      <div>
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          {icon}
          {title}
        </div>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

// Every-Nth month ticks so the axis stays readable across many months.
const monthTickInterval = (n) => (n > 24 ? 3 : n > 12 ? 2 : 0);

const MonthlyReportSection = () => {
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${process.env.PUBLIC_URL}/data/TROPESS_downloads.json`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setReport(await res.json());
      } catch (e) {
        console.error('Failed to load TROPESS download metrics:', e);
        setError(e.message);
      }
    };
    load();
  }, []);

  const monthlyChart = useMemo(
    () => (report?.monthly || []).map((m) => ({
      ...m,
      label: formatMonth(m.month),
      requests_k: +(m.files / 1000).toFixed(2),
    })),
    [report]
  );

  const speciesChart = useMemo(
    () => (report?.monthly_by_species || []).map((m) => ({
      ...m,
      label: formatMonth(m.month),
    })),
    [report]
  );

  if (error) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
        <div className="text-lg font-semibold text-gray-800 mb-2">Monthly Download Report</div>
        <p className="text-sm text-red-600">
          Unable to load download metrics ({error}). Run{' '}
          <code>python scripts/build_tropess_downloads.py</code> to generate the data.
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
        <div className="text-lg font-semibold text-gray-800 mb-2">Monthly Download Report</div>
        <p className="text-sm text-gray-500">Loading download metrics…</p>
      </div>
    );
  }

  const { meta } = report;
  const rangeStart = formatMonthLong(meta.date_range.start);
  const rangeEnd = formatMonthLong(meta.date_range.end);

  const pieLabel = ({ name, percent }) =>
    percent > 0.04 ? `${name} ${(percent * 100).toFixed(0)}%` : '';

  const filesTooltip = (value) => [`${Number(value).toLocaleString()} files`, 'Downloads'];

  // Timeline annotations placed on the monthly x-axis (matched to data months).
  // Stagger labels across two rows so nearby milestones don't overlap.
  const annotations = (report.annotations || [])
    .map((a) => ({ ...a, label_x: formatMonth(a.month) }))
    .filter((a) => monthlyChart.some((m) => m.month === a.month))
    .map((a, idx) => ({ ...a, row: idx % 2 }));

  // Megacity data with percentage labels.
  const megacityData = (() => {
    const total = report.cumulative_by_megacity.reduce((s, c) => s + c.files, 0) || 1;
    return report.cumulative_by_megacity.map((c) => ({
      ...c,
      pct: (c.files / total) * 100,
    }));
  })();

  const pctLabel = (v) => `${v.toFixed(1)}%`;

  // Country pie data with percentage labels (mirrors deck slide 7).
  const countryPieData = (() => {
    const total = report.cumulative_by_country.reduce((s, c) => s + c.files, 0) || 1;
    return report.cumulative_by_country
      .slice()
      .sort((a, b) => b.files - a.files)
      .map((c) => ({ ...c, pct: (c.files / total) * 100 }));
  })();

  return (
    <section className="mb-6">
      {/* Section header */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6 border-t-4 border-sky-600">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-50 rounded-lg">
            <Download size={24} className="text-sky-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Monthly Download Report</h2>
            <p className="text-gray-500 text-sm mt-1">
              TROPESS data-product downloads from NASA GES DISC · {rangeStart} – {rangeEnd}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div>
            <div className="text-2xl font-bold text-gray-900">{(meta.total_files / 1e6).toFixed(2)}M</div>
            <div className="text-xs text-gray-500">Files downloaded</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{meta.total_volume_tb.toFixed(1)} TB</div>
            <div className="text-xs text-gray-500">Total volume</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{report.monthly.length}</div>
            <div className="text-xs text-gray-500">Months reported</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{report.cumulative_by_country.length}</div>
            <div className="text-xs text-gray-500">Countries</div>
          </div>
        </div>
      </div>

      {/* Slide 3: monthly requests + volume, with release-milestone markers */}
      <Card
        title="Downloads by Month"
        subtitle="Download requests (files) and download volume per month"
        icon={<Database size={18} className="text-sky-600" />}
        className="mb-6"
      >
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={monthlyChart} margin={{ top: 52, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11 }}
              interval={monthTickInterval(monthlyChart.length)}
            />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }}
              label={{ value: 'Requests (K files)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }}
              label={{ value: 'Volume (TB)', angle: 90, position: 'insideRight', style: { fontSize: 11, fill: '#6b7280' } }} />
            <Tooltip
              formatter={(value, name) =>
                name === 'Volume (TB)'
                  ? [`${Number(value).toFixed(2)} TB`, name]
                  : [`${(Number(value) * 1000).toLocaleString()} files`, 'Requests']
              }
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {annotations.map((a) => (
              <ReferenceLine
                key={`${a.month}-${a.label}`}
                yAxisId="left"
                x={a.label_x}
                stroke="#9ca3af"
                strokeDasharray="4 3"
                label={(props) => {
                  // Stagger onto two rows (row 0 higher, row 1 lower) to avoid overlap.
                  const { viewBox } = props;
                  const cx = viewBox.x;
                  const topY = viewBox.y;
                  const y = a.row === 0 ? topY - 40 : topY - 22;
                  return (
                    <text x={cx} y={y} textAnchor="middle" fontSize={9} fill="#6b7280">
                      {a.label}
                    </text>
                  );
                }}
              />
            ))}
            <Bar yAxisId="left" dataKey="requests_k" name="Requests" fill="#3B82F6" radius={[2, 2, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="volume_tb" name="Volume (TB)"
              stroke="#EF4444" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
        {annotations.length > 0 && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
            {annotations.map((a) => (
              <span key={a.month}>
                <span className="text-gray-400">▎</span> {formatMonth(a.month)}: {a.label}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* Slide 4: monthly volume by species */}
      <Card
        title="Download Volume by Species per Month"
        subtitle="Monthly download volume (GB) for the primary trace-gas species"
        icon={<Layers size={18} className="text-sky-600" />}
        className="mb-6"
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={speciesChart} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={monthTickInterval(speciesChart.length)} />
            <YAxis tick={{ fontSize: 11 }}
              label={{ value: 'Volume (GB)', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#6b7280' } }} />
            <Tooltip formatter={(value, name) => [`${Number(value).toFixed(1)} GB`, name]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {TIMESERIES_SPECIES.map((sp) => (
              <Line key={sp} type="monotone" dataKey={sp} name={sp}
                stroke={SPECIES_COLORS[sp]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Slide 5: cumulative downloads by species + by megacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card
          title="Cumulative Downloads by Species"
          subtitle={`Files downloaded · ${rangeStart} – ${rangeEnd}`}
          icon={<Layers size={18} className="text-sky-600" />}
        >
          <ResponsiveContainer width="100%" height={340}>
            <PieChart>
              <Pie
                data={report.cumulative_by_species}
                dataKey="files"
                nameKey="species"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={pieLabel}
                labelLine={false}
              >
                {report.cumulative_by_species.map((entry, i) => (
                  <Cell key={entry.species} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Pie>
              <Tooltip formatter={filesTooltip} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card
          title="Cumulative Downloads by Megacity"
          subtitle="Megacity data-product collections"
          icon={<Building2 size={18} className="text-sky-600" />}
        >
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={megacityData}
              layout="vertical"
              margin={{ top: 10, right: 70, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatFiles}
                label={{ value: 'Files downloaded', position: 'insideBottom', offset: -2, style: { fontSize: 11, fill: '#6b7280' } }} />
              <YAxis type="category" dataKey="city" tick={{ fontSize: 12 }} width={90} />
              <Tooltip formatter={(value, name, props) =>
                [`${Number(value).toLocaleString()} files (${props.payload.pct.toFixed(1)}%)`, 'Downloads']} />
              <Bar dataKey="files" name="Downloads" radius={[0, 3, 3, 0]}>
                {megacityData.map((entry, i) => (
                  <Cell key={entry.city} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
                <LabelList dataKey="pct" position="right" formatter={pctLabel}
                  style={{ fontSize: 11, fill: '#374151' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Slide 6: cumulative downloads by processing type */}
      <Card
        title="Cumulative Downloads by Processing Type"
        subtitle={`Files downloaded · ${rangeStart} – ${rangeEnd}`}
        icon={<Layers size={18} className="text-sky-600" />}
        className="mb-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={report.cumulative_by_type}
                dataKey="files"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
              >
                {report.cumulative_by_type.map((entry) => (
                  <Cell key={entry.type} fill={TYPE_COLORS[entry.type] || '#9ca3af'} />
                ))}
              </Pie>
              <Tooltip formatter={filesTooltip} />
            </PieChart>
          </ResponsiveContainer>
          <div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 font-medium">Processing Type</th>
                  <th className="py-2 font-medium">Description</th>
                  <th className="py-2 font-medium text-right">Downloads</th>
                </tr>
              </thead>
              <tbody>
                {TYPE_DESCRIPTIONS.map(({ type, desc }) => {
                  const row = report.cumulative_by_type.find((t) => t.type === type);
                  return (
                    <tr key={type} className="border-b last:border-0">
                      <td className="py-2">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: TYPE_COLORS[type] }} />
                          {type}
                        </span>
                      </td>
                      <td className="py-2 text-gray-600">{desc}</td>
                      <td className="py-2 text-right font-medium">
                        {row ? `${row.files.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Slide 7: cumulative downloads by country */}
      <Card
        title="Cumulative Downloads by Country"
        subtitle={`Country of the requesting user · ${rangeStart} – ${rangeEnd}`}
        icon={<Globe size={18} className="text-sky-600" />}
        className="mb-2"
      >
        {/* Choropleth world map */}
        <CountryVolumeMap countryMap={report.country_map || []} />

        {/* Country pie chart (matches deck slide 7) */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="text-sm font-medium text-gray-600 mb-2">Top countries by downloads</div>
          <ResponsiveContainer width="100%" height={420}>
            <PieChart>
              <Pie
                data={countryPieData}
                dataKey="files"
                nameKey="country"
                cx="50%"
                cy="50%"
                outerRadius={150}
                label={({ country, pct }) => (pct >= 1.5 ? `${country} ${pct.toFixed(1)}%` : '')}
                labelLine={{ stroke: '#cbd5e1' }}
              >
                {countryPieData.map((entry, i) => (
                  <Cell
                    key={entry.country}
                    fill={entry.country === 'Other' ? '#9ca3af' : CATEGORICAL[i % CATEGORICAL.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) =>
                [`${Number(value).toLocaleString()} files (${props.payload.pct.toFixed(1)}%)`, props.payload.country]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <p className="text-xs text-gray-400 mt-2">
        Credit: Usage metrics data provided by GES DISC. Graphs produced by JPL.
      </p>
    </section>
  );
};

export default MonthlyReportSection;
