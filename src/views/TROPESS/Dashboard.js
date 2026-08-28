// TROPESS Citations dashboard.
//
// Audience: science-impact readers; citations, research domains, engagement.
// The published product catalog and download metrics live on the companion
// page at /TROPESS/data-products.
import React, { useState, useEffect } from 'react';
import { ExternalLink, Database, Globe, BarChart3, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import NavBar from '../../components/NavBar';

// Import components
import PaperInfo from '../../components/PaperInfo';
import ModelInfoSection from '../../components/ModelInfoSection';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Import section components
import MetricsOverview from '../sections/MetricsOverview';

// Import chart components
import CitationTrendsChart from '../../components/charts/CitationTrendsChart';
import ResearchDomainsCard from '../../components/charts/ResearchDomainsCard';
import EngagementLevelsCard from '../../components/charts/EngagementLevelsCard';
import FutureTrendsChart from '../../components/charts/FutureTrendsChart';
import DashboardSummaryCard from '../../components/charts/DashboardSummaryCard';
import JournalDistributionCard from '../../components/charts/JournalDistributionCard';
import MissionsSummary from '../../components/MissionsSummary';
import UncertaintyOverviewCard from '../../components/charts/UncertaintyOverviewCard';
import UncertaintyMatrixCard from '../../components/charts/UncertaintyMatrixCard';
import PaperTypeCard from '../../components/charts/PaperTypeCard';
import TropessPageTabs from '../../components/tropess/TropessPageTabs';

const TROPESSDashboard = () => {
  const [tropessData, setTropessData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { loadModelData } = await import('../../utils/dataLoader');
        const data = await loadModelData('TROPESS');
        setTropessData(data);
      } catch (error) {
        console.error('Failed to load TROPESS data:', error);
      }
    };
    loadData();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      <NavBar activeItem="TROPESS" />

      <main className="max-w-7xl mx-auto px-4 py-6">

        <TropessPageTabs active="publications" />

        <ModelInfoSection modelName="TROPESS" modelDisplayName="TROPESS" />
        <PaperInfo modelName="TROPESS" />
        <Header modelName="TROPESS" />

        {/* Data Verification Section */}
        <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
          <div className="text-lg font-semibold text-gray-800 mb-4">Verify & Explore the Data</div>
          <p className="text-sm text-gray-600 mb-4">
            This dashboard provides visualizations based on actual citation data. You can explore and verify the raw data using the following detailed views:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/TROPESS/citations"
              className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
            >
              <div className="mr-4 bg-blue-100 p-3 rounded-full">
                <Database size={24} className="text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-blue-900">Raw Citation Data</div>
                <div className="text-sm text-blue-700">All papers citing TROPESS team papers</div>
              </div>
              <ExternalLink size={16} className="ml-auto text-blue-400" />
            </Link>

            <Link
              to="/TROPESS/geographic-impact"
              className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors"
            >
              <div className="mr-4 bg-green-100 p-3 rounded-full">
                <Globe size={24} className="text-green-600" />
              </div>
              <div>
                <div className="font-medium text-green-900">Geographic Impact</div>
                <div className="text-sm text-green-700">Explore regions</div>
              </div>
              <ExternalLink size={16} className="ml-auto text-green-400" />
            </Link>

            <Link
              to="/TROPESS/research-domains"
              className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-100 hover:bg-purple-100 transition-colors"
            >
              <div className="mr-4 bg-purple-100 p-3 rounded-full">
                <BarChart3 size={24} className="text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-purple-900">Research Domains</div>
                <div className="text-sm text-purple-700">Analyze topics and applications</div>
              </div>
              <ExternalLink size={16} className="ml-auto text-purple-400" />
            </Link>

            <Link
              to="/TROPESS/uncertainty"
              className="flex items-center p-4 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 transition-colors"
            >
              <div className="mr-4 bg-amber-100 p-3 rounded-full">
                <ShieldCheck size={24} className="text-amber-600" />
              </div>
              <div>
                <div className="font-medium text-amber-900">Uncertainty Analysis</div>
                <div className="text-sm text-amber-700">Classification confidence</div>
              </div>
              <ExternalLink size={16} className="ml-auto text-amber-400" />
            </Link>
          </div>
        </div>

        <MetricsOverview data={tropessData} />
        <CitationTrendsChart data={tropessData} />

        <div className="grid grid-cols-2 gap-6 mb-6">
          <ResearchDomainsCard data={tropessData} />
          <EngagementLevelsCard data={tropessData} />
        </div>

        {/* Future Trends + Paper Type Classification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <FutureTrendsChart data={tropessData} />

          <PaperTypeCard data={tropessData} />
        </div>

        <div className="mb-6">
          <MissionsSummary citationsData={tropessData} maxMissions={8} showDetails={true} />
        </div>

        <DashboardSummaryCard data={tropessData} />

        <div className="grid grid-cols-1 gap-6 mb-6">
          <JournalDistributionCard data={tropessData} />
        </div>

        {tropessData.length > 0 && tropessData[0]?.uncertainty && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UncertaintyOverviewCard data={tropessData} modelName="TROPESS" />
            <UncertaintyMatrixCard data={tropessData} />
          </div>
        )}

        <Footer isJEOE />
      </main>
    </div>
  );
};

export default TROPESSDashboard;
