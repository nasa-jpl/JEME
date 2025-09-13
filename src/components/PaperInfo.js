// src/components/PaperInfo.js
// Information about the original RAPID paper and related citations

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const PaperInfo = ({ modelName = 'RAPID' }) => {
  const [expanded, setExpanded] = useState(false);
  const [eccoTeamPapers, setEccoTeamPapers] = useState([]);
  const [issmTeamPapers, setIssmTeamPapers] = useState([]);
  const [momoChemTeamPapers, setMomoChemTeamPapers] = useState([]);
  const [cardamomTeamPapers, setCardamomTeamPapers] = useState([]);

  // Load ECCO team papers from JSON file
  useEffect(() => {
    if (modelName === 'ECCO') {
      fetch('/science-model-dashboard/data/ecco_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data.ECCO) {
            setEccoTeamPapers(data.ECCO);
          }
        })
        .catch(error => {
          console.error('Failed to load ECCO team papers:', error);
        });
    }
  }, [modelName]);

  // Load ISSM team papers from JSON file
  useEffect(() => {
    if (modelName === 'ISSM') {
      fetch('/science-model-dashboard/data/issm_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data.ISSM) {
            setIssmTeamPapers(data.ISSM);
          }
        })
        .catch(error => {
          console.error('Failed to load ISSM team papers:', error);
        });
    }
  }, [modelName]);

  // Load MOMO-CHEM team papers from JSON file
  useEffect(() => {
    if (modelName === 'MOMO-CHEM') {
      fetch('/science-model-dashboard/data/momo_chem_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data['MOMO-CHEM']) {
            setMomoChemTeamPapers(data['MOMO-CHEM']);
          }
        })
        .catch(error => {
          console.error('Failed to load MOMO-CHEM team papers:', error);
        });
    }
  }, [modelName]);

  // Load CARDAMOM team papers from JSON file
  useEffect(() => {
    if (modelName === 'CARDAMOM') {
      fetch('/science-model-dashboard/data/cardamom_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data.CARDAMOM) {
            setCardamomTeamPapers(data.CARDAMOM);
          }
        })
        .catch(error => {
          console.error('Failed to load CARDAMOM team papers:', error);
        });
    }
  }, [modelName]);

  // Model-specific paper data
  const modelPapers = {
    'RAPID': {
      title: "River network routing on the NHDPlus dataset",
      authors: "Cédric H. David, David R. Maidment, Guo-Yue Niu, Zong-Liang Yang, Florence Habets, Victor Eijkhout",
      journal: "Journal of Hydrometeorology (2011), Volume 12, Issue 5, Pages 913-934",
      doi: "10.1175/2011JHM1345.1",
      link: "http://dx.doi.org/10.1175/2011JHM1345.1"
    },
    'CMS-Flux': {
      title: "Carbon Monitoring System Flux Net Biosphere Exchange 2020 (CMS-Flux NBE 2020)",
      authors: "Liu, J., Baskaran, L., Bowman, K., Schimel, D., Bloom, A. A., Parazoo, N. C., et al.",
      journal: "Earth System Science Data, 13, 299-330",
      doi: "10.5194/essd-13-299-2021",
      link: "https://doi.org/10.5194/essd-13-299-2021"
    },
    'ECCO': {
      title: "The ECCO‐Darwin Data‐Assimilative Global Ocean Biogeochemistry Model: Estimates of Seasonal to Multidecadal Surface Ocean pCO2 and Air‐Sea CO2 Flux",
      authors: "Carroll, D., Menemenlis, D., Adkins, J. F., Bowman, K. W., Brix, H., Dutkiewicz, S., et al.",
      journal: "Journal of Advances in Modeling Earth Systems, 12(10)",
      doi: "10.1029/2019MS001888",
      link: "https://doi.org/10.1029/2019MS001888"
    },
    'ISSM': {
      title: "Continental scale, high order, high spatial resolution, ice sheet modeling using the Ice Sheet System Model (ISSM)",
      authors: "Larour, E., Seroussi, H., Morlighem, M., & Rignot, E.",
      journal: "Journal of Geophysical Research: Earth Surface, 117(F1)",
      doi: "10.1029/2011JF002140",
      link: "https://doi.org/10.1029/2011JF002140"
    },
    'MOMO-CHEM': {
      title: "A tropospheric chemistry reanalysis for the years 2005–2012 based on an assimilation of OMI, MLS, TES, and MOPITT satellite data",
      authors: "Miyazaki, K., Eskes, H. J., and Sudo, K.",
      journal: "Atmos. Chem. Phys., 15, 8315-8348",
      doi: "10.5194/acp-15-8315-2015",
      link: "https://doi.org/10.5194/acp-15-8315-2015"
    },
    'CARDAMOM': {
      title: "The decadal state of the terrestrial carbon cycle: Global retrievals of terrestrial carbon allocation, pools, and residence times",
      authors: "A. Anthony Bloom, Jean-François Exbrayat, Ivar R. van der Velde, Liang Feng, Mathew Williams",
      journal: "Proceedings of the National Academy of Sciences",
      doi: "10.1073/pnas.1515160113",
      link: "https://doi.org/10.1073/pnas.1515160113"
    }
  };

  const originalPaper = modelPapers[modelName] || modelPapers['RAPID'];

  // Model-specific related papers
  const modelRelatedPapers = {
    'RAPID': [
    {
      authors: "David, Cédric H., Florence Habets, David R. Maidment and Zong-Liang Yang",
      title: "RAPID applied to the SIM-France model",
      journal: "Hydrological Processes, 25(22), 3412-3425",
      year: 2011,
      doi: "10.1002/hyp.8070",
      link: "http://dx.doi.org/10.1002/hyp.8070"
    },
    {
      authors: "Saleh, Firas, Nicolas Flipo, Florence Habets, Agnès Ducharne, Ludovic Oudin, Pascal Viennot and Emmanuel Ledoux",
      title: "Modeling the impact of in-stream water level fluctuations on stream-aquifer interactions at the regional scale",
      journal: "Journal of Hydrology, 400, 490-500",
      year: 2011,
      doi: "10.1016/j.jhydrol.2011.02.001",
      link: "http://dx.doi.org/10.1016/j.jhydrol.2011.02.001"
    },
    {
      authors: "Flipo, Nicolas, Céline Monteil, Michel Poulin, Chantal de Fouquet and Mohamed Krimissa",
      title: "Hybrid fitting of a hydrosystem model: Long-term insight into the Beauce aquifer functioning (France)",
      journal: "Water Resources Research, 48, 1-21",
      year: 2012,
      doi: "10.1029/2011WR011092",
      link: "http://dx.doi.org/10.1029/2011WR011092"
    },
    {
      authors: "Thierion, Charlotte, Laurent Longuevergne, Florence Habets, Emmanuel Ledoux, Philippe Ackerer, Samer Majdalani, Etienne Leblois, Simon Lecluse, Eric Martin, Solen Queguiner and Pascal Viennot",
      title: "Assessing the water balance of the Upper Rhine Graben hydrosystem",
      journal: "Journal of Hydrology, 424-425, 68-83",
      year: 2012,
      doi: "10.1016/j.jhydrol.2011.12.028",
      link: "http://dx.doi.org/10.1016/j.jhydrol.2011.12.028"
    },
    {
      authors: "David, Cédric H., Zong-Liang Yang and Seungbum Hong",
      title: "Regional-scale river flow modeling using off-the-shelf runoff products, thousands of mapped rivers and hundreds of stream flow gauges",
      journal: "Environmental Modelling & Software, 42, 116-132",
      year: 2013,
      doi: "10.1016/j.envsoft.2012.12.011",
      link: "http://dx.doi.org/10.1016/j.envsoft.2012.12.011"
    },
    {
      authors: "David, Cédric H., Zong-Liang Yang and James S. Famiglietti",
      title: "Quantification of the upstream-to-downstream influence in the Muskingum method, and implications for speedup in parallel computations of river flow",
      journal: "Water Resources Research, 49(5), 1-18",
      year: 2013,
      doi: "10.1002/wrcr.20250",
      link: "http://dx.doi.org/10.1002/wrcr.20250"
    },
    {
      authors: "Häfliger, Vincent, Eric Martin, Aaron Boone, Florence Habets, Cédric H. David, Pierre-A. Garambois, Hélène Roux, Sophie Ricci, Lucie Berthon, Anthony Thévenin, and Sylvain Biancamaria",
      title: "Evaluation of regional-scale water level simulations using various river routing schemes within a hydrometeorological modelling framework for the preparation of the SWOT mission",
      journal: "Journal of Hydrometeorology, 16(4), 1821-1842",
      year: 2015,
      doi: "10.1175/JHM-D-14-0107.1",
      link: "http://dx.doi.org/10.1175/JHM-D-14-0107.1"
    },
    {
      authors: "David, Cédric H., James S. Famiglietti, Zong-Liang Yang, and Victor Eijkhout",
      title: "Enhanced fixed-size parallel speedup with the Muskingum method using a trans-boundary approach and a large sub-basins approximation",
      journal: "Water Resources Research, 51(9), 1-25",
      year: 2015,
      doi: "10.1002/2014WR016650",
      link: "http://dx.doi.org/10.1002/2014WR016650"
    },
    {
      authors: "Tavakoly, Ahmad A., David R. Maidment, James McClelland, Tim Whiteaker, Zong-Liang Yang, Claire Griffin, Cédric H. David, and Lisa Meyer",
      title: "A GIS Framework for Regional Modeling of Riverine Nitrogen Transport: Case Study, San Antonio and Guadalupe Basins",
      journal: "Journal of the American Water Resources Association, 52(1), 1-15",
      year: 2015,
      doi: "10.1111/1752-1688.12355",
      link: "http://dx.doi.org/10.1111/1752-1688.12355"
    },
    {
      authors: "Lin, Peirong, Zong-Liang Yang, Xitian Cai, and Cédric H. David",
      title: "Development and evaluation of a physically-based lake level model for water resource management: A case study for Lake Buchanan, Texas",
      journal: "Journal of Hydrology: Regional Studies, 4(B), 661-674",
      year: 2015,
      doi: "10.1016/j.ejrh.2015.08.005",
      link: "http://dx.doi.org/10.1016/j.ejrh.2015.08.005"
    },
    {
      authors: "David, Cédric H., James S. Famiglietti, Zong-Liang Yang, and David R. Maidment",
      title: "A Decade of RAPID – Reflections on the Development of an Open Source Geoscience Code",
      journal: "Earth and Space Science, 3, 1-19",
      year: 2016,
      doi: "10.1002/2015EA000142",
      link: "http://dx.doi.org/10.1002/2015EA000142"
    },
    {
      authors: "Snow, Alan D., Scott D. Christensen, Nathan R. Swain, James Nelson, Daniel P. Ames, Norman L. Jones, Deng Ding, Nawajish Noman, Cédric H. David, Florian Pappenberger",
      title: "A Cloud-Based High-Resolution National Hydrologic Forecast System Downscaled from a Global Ensemble Land Surface Model",
      journal: "Journal of the American Water Resources Association, 1-15",
      year: 2016,
      doi: "10.1111/1752-1688.12434",
      link: "http://dx.doi.org/10.1111/1752-1688.12434"
    },
    {
      authors: "Tavakoly, Ahmad A., Alan D. Snow, Cédric H. David, Michael L. Follum, David R. Maidment, Zong-Liang Yang",
      title: "Continental Scale River Flow Modeling of the Mississippi River Basin Using High-Resolution NHDPlus Dataset",
      journal: "Journal of the American Water Resources Association, 1-22",
      year: 2016,
      doi: "10.1111/1752-1688.12456",
      link: "http://dx.doi.org/10.1111/1752-1688.12456"
    },
    {
      authors: "Follum, Michael L., Ahmad A. Tavakoly, Jeffrey D. Niemann, and Alan D. Snow",
      title: "AutoRAPID: A Model for Prompt Streamflow Estimation and Flood Inundation Mapping over Regional to Continental Extents",
      journal: "Journal of the American Water Resources Association, 1-20",
      year: 2016,
      doi: "10.1111/1752-1688.12476",
      link: "http://dx.doi.org/10.1111/1752-1688.12476"
    },
    {
      authors: "Swain, Nathan R., Scott D. Christensen, Alan D. Snow, Herman Dolder, Gonzalo Espinoza-Davalos, Erfan Goharian, Norman L. Jones, E. James Nelson, Daniel P. Ames, Steven J. Burian",
      title: "A new open source platform for lowering the barrier for environmental web app development",
      journal: "Environmental Modelling & Software, 85, 11-26, 1-20",
      year: 2016,
      doi: "10.1016/j.envsoft.2016.08.003",
      link: "http://dx.doi.org/10.1016/j.envsoft.2016.08.003"
    },
    {
      authors: "Salas, Fernando R., Marcelo A. Somos-Valenzuela, Aubrey Dugger, David R. Maidment, David J. Gochis, Cédric H. David, Wei Yu, Deng Ding, Edward P. Clark, and Nawajish Noman",
      title: "Towards Real-Time Continental Scale Streamflow Simulation in Continuous and Discrete Space",
      journal: "JAWRA Journal of the American Water Resources Association",
      year: 2017,
      doi: "10.1111/1752-1688.12586",
      link: "http://dx.doi.org/10.1111/1752-1688.12586"
    }
    ],
    'CMS-Flux': [
      {
        authors: "Byrne, B., Liu, J., Bowman, K. W., Pascolini-Campbell, M., Chatterjee, A., Pandey, S., et al.",
        title: "Carbon emissions from the 2023 Canadian wildfires",
        journal: "Nature",
        year: 2024,
        doi: "10.1038/s41586-024-07878-z",
        link: "http://dx.doi.org/10.1038/s41586-024-07878-z"
      },
      {
        authors: "Byrne, B., Liu, J., Bowman, K. W., Yin, Y., Yun, J., Ferreira, G. D., et al.",
        title: "Regional Inversion Shows Promise in Capturing Extreme-Event-Driven CO2 Flux Anomalies but Is Limited by Atmospheric CO2 Observational Coverage",
        journal: "Journal of Geophysical Research: Atmospheres",
        year: 2024,
        doi: "10.1029/2023jd040006",
        link: "http://dx.doi.org/10.1029/2023jd040006"
      },
      {
        authors: "Liu, J., Baker, D., Basu, S., Bowman, K., Byrne, B., Chevallier, F., et al.",
        title: "The reduced net carbon uptake over Northern Hemisphere land causes the close-to-normal CO2 growth rate in 2021 La Niña",
        journal: "Science Advances",
        year: 2024,
        doi: "10.1126/sciadv.adl2201",
        link: "http://dx.doi.org/10.1126/sciadv.adl2201"
      },
      {
        authors: "Byrne, B., et al.",
        title: "National CO2 budgets (2015–2020) inferred from atmospheric CO2 observations in support of the global stocktake",
        journal: "Earth System Science Data",
        year: 2023,
        doi: "10.5194/essd-15-963-2023",
        link: "http://dx.doi.org/10.5194/essd-15-963-2023"
      },
      {
        authors: "Levine, P. A., Bloom, A. A., Bowman, K. W., Reager, J. T., Worden, J. R., Liu, J., et al.",
        title: "Water Stress Dominates 21st-Century Tropical Land Carbon Uptake",
        journal: "Global Biogeochemical Cycles",
        year: 2023,
        doi: "10.1029/2023gb007702",
        link: "http://dx.doi.org/10.1029/2023gb007702"
      },
      {
        authors: "Carroll, D., Menemenlis, D., Dutkiewicz, S., Lauderdale, J. M., Adkins, J. F., Bowman, K. W., et al.",
        title: "Attribution of Space-Time Variability in Global-Ocean Dissolved Inorganic Carbon",
        journal: "Global Biogeochemical Cycles",
        year: 2022,
        doi: "10.1029/2021GB007162",
        link: "http://dx.doi.org/10.1029/2021GB007162"
      },
      {
        authors: "Hurtt, G. C., Andrews, A., Bowman, K., Brown, M. E., Chatterjee, A., Escobar, V., et al.",
        title: "The NASA Carbon Monitoring System Phase 2 synthesis: scope, findings, gaps and recommended next steps",
        journal: "Environmental Research Letters",
        year: 2022,
        doi: "10.1088/1748-9326/ac7407",
        link: "http://dx.doi.org/10.1088/1748-9326/ac7407"
      },
      {
        authors: "Liu, J., Baskaran, L., Bowman, K., Schimel, D., Bloom, A. A., Parazoo, N. C., et al.",
        title: "Carbon Monitoring System Flux Net Biosphere Exchange 2020 (CMS-Flux NBE 2020)",
        journal: "Earth System Science Data",
        year: 2021,
        doi: "10.5194/essd-13-299-2021",
        link: "http://dx.doi.org/10.5194/essd-13-299-2021"
      },
      {
        authors: "Bloom, A. A., Bowman, K. W., Liu, J., Konings, A. G., Worden, J. R., Parazoo, N. C., et al.",
        title: "Lagged effects regulate the inter-annual variability of the tropical carbon balance",
        journal: "Biogeosciences",
        year: 2020,
        doi: "10.5194/bg-17-6393-2020",
        link: "http://dx.doi.org/10.5194/bg-17-6393-2020"
      },
      {
        authors: "Byrne, B., Liu, J., Bloom, A. A., Bowman, K. W., Butterfield, Z., Joiner, J., et al.",
        title: "Contrasting Regional Carbon Cycle Responses to Seasonal Climate Anomalies Across the East‐West Divide of Temperate North America",
        journal: "Global Biogeochemical Cycles",
        year: 2020,
        doi: "10.1029/2020GB006598",
        link: "http://dx.doi.org/10.1029/2020GB006598"
      },
      {
        authors: "Carroll, D., Menemenlis, D., Adkins, J. F., Bowman, K. W., Brix, H., Dutkiewicz, S., et al.",
        title: "The ECCO‐Darwin data‐assimilative global ocean biogeochemistry model: Estimates of seasonal to multidecadal surface ocean pCO2 and air‐sea CO2 flux",
        journal: "Journal of Advances in Modeling Earth Systems",
        year: 2020,
        doi: "10.1029/2019MS001888",
        link: "http://dx.doi.org/10.1029/2019MS001888"
      },
      {
        authors: "Crowell, S., Baker, D., Schuh, A., Basu, S., Jacobson, A. R., Chevallier, F., et al.",
        title: "The 2015–2016 carbon cycle as seen from OCO-2 and the global in situ network",
        journal: "Atmospheric Chemistry and Physics",
        year: 2019,
        doi: "10.5194/acp-19-9797-2019",
        link: "http://dx.doi.org/10.5194/acp-19-9797-2019"
      },
      {
        authors: "Liu, J., Bowman, K. W., Schimel, D. S., Parazoo, N. C., Jiang, Z., Lee, M., et al.",
        title: "Contrasting carbon cycle responses of the tropical continents to the 2015-2016 El Nino",
        journal: "Science",
        year: 2017,
        doi: "10.1126/science.aam5690",
        link: "http://dx.doi.org/10.1126/science.aam5690"
      },
      {
        authors: "Bloom, A. A., Bowman, K., Lee, M., Turner, A. J., Schroeder, R., Worden, J. R., et al.",
        title: "A global wetland methane emissions and uncertainty dataset for atmospheric chemical transport models (WetCHARTs version 1.0)",
        journal: "Geoscientific Model Development",
        year: 2017,
        doi: "10.5194/gmd-10-2141-2017",
        link: "http://dx.doi.org/10.5194/gmd-10-2141-2017"
      },
      {
        authors: "Liu, J., Bowman, K. W., Lee, M., Henze, D. K., Bousserez, N., Brix, H., et al.",
        title: "Carbon monitoring system flux estimation and attribution: impact of ACOS-GOSAT XCO2 sampling on the inference of terrestrial biospheric sources and sinks",
        journal: "Tellus B",
        year: 2014,
        doi: "10.3402/tellusb.v66.22486",
        link: "http://dx.doi.org/10.3402/tellusb.v66.22486"
      }
    ],
    'ECCO': [], // Will be loaded dynamically
    'ISSM': [], // Will be loaded dynamically
    'MOMO-CHEM': [],
    'CARDAMOM': []
  };

  // Get the appropriate related papers for the current model
  // For ECCO, ISSM, MOMO-CHEM, and CARDAMOM, use dynamically loaded papers if available
  const relatedPapers = 
    (modelName === 'ECCO' && eccoTeamPapers.length > 0) ? eccoTeamPapers :
    (modelName === 'ISSM' && issmTeamPapers.length > 0) ? issmTeamPapers :
    (modelName === 'MOMO-CHEM' && momoChemTeamPapers.length > 0) ? momoChemTeamPapers :
    (modelName === 'CARDAMOM' && cardamomTeamPapers.length > 0) ? cardamomTeamPapers :
    (modelRelatedPapers[modelName] || modelRelatedPapers['RAPID']);

  return (
    <div className="bg-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-500">
      {/* Original paper section */}
      <div className="font-semibold text-blue-900 mb-2">{originalPaper.title}</div>
      <div className="text-sm text-gray-700 mb-2">{originalPaper.authors}</div>
      <div className="text-xs text-gray-600">{originalPaper.journal}</div>
      <div className="flex justify-between items-center mt-2">
        <div className="text-xs text-blue-600">
          DOI: <a href={originalPaper.link} className="hover:underline" target="_blank" rel="noopener noreferrer">
            {originalPaper.doi}
          </a>
        </div>

      </div>

      {/* Toggle button */}
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="mt-3 flex items-center text-xs text-blue-700 hover:text-blue-900"
      >
        {expanded ? (
          <>
            <ChevronUp size={14} className="mr-1" />
            <span>Hide Team Papers</span>
          </>
        ) : (
          <>
            <ChevronDown size={14} className="mr-1" />
            <span>View All Team Papers</span>
          </>
        )}
      </button>

      {/* Related papers list */}
      {expanded && (
        <div className="mt-4 border-t border-blue-200 pt-3">
          <div className="text-sm font-medium text-blue-800 mb-2">Team Papers:</div>
          <div className="max-h-96 overflow-y-auto pr-2">
            {relatedPapers.map((paper, index) => (
              <div key={index} className="mb-4 pb-3 border-b border-blue-100 last:border-b-0">
                <div className="text-sm font-medium text-gray-800 mb-1">{paper.title}</div>
                <div className="text-xs text-gray-600 mb-1">{paper.authors}</div>
                <div className="text-xs text-gray-500">{paper.journal} ({paper.year})</div>
                <div className="flex items-center mt-1">
                  <a 
                    href={paper.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <span>DOI: {paper.doi}</span>
                    <ExternalLink size={10} className="ml-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperInfo;