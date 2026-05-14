// src/components/PaperInfo.js
// Information about the original RAPID paper and related citations

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const PaperInfo = ({ modelName = 'RAPID' }) => {
  const [expanded, setExpanded] = useState(false);
  const [rapidTeamPapers, setRapidTeamPapers] = useState([]);
  const [cmsFluxTeamPapers, setCmsFluxTeamPapers] = useState([]);
  const [eccoTeamPapers, setEccoTeamPapers] = useState([]);
  const [issmTeamPapers, setIssmTeamPapers] = useState([]);
  const [momoChemTeamPapers, setMomoChemTeamPapers] = useState([]);
  const [cardamomTeamPapers, setCardamomTeamPapers] = useState([]);
  const [lesTeamPapers, setLesTeamPapers] = useState([]);
  const [edmfTeamPapers, setEdmfTeamPapers] = useState([]);
  const [graceTeamPapers, setGraceTeamPapers] = useState([]);
  const [swotTeamPapers, setSwotTeamPapers] = useState([]);
  const [tropessTeamPapers, setTropessTeamPapers] = useState([]);

  // Load RAPID team papers from JSON file
  useEffect(() => {
    if (modelName === 'RAPID') {
      fetch(process.env.PUBLIC_URL + '/data/rapid_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data.RAPID) {
            setRapidTeamPapers(data.RAPID);
          }
        })
        .catch(error => {
          console.error('Failed to load RAPID team papers:', error);
        });
    }
  }, [modelName]);

  // Load CMS-Flux team papers from JSON file
  useEffect(() => {
    if (modelName === 'CMS-Flux') {
      fetch(process.env.PUBLIC_URL + '/data/cms_flux_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data['CMS-Flux']) {
            setCmsFluxTeamPapers(data['CMS-Flux']);
          }
        })
        .catch(error => {
          console.error('Failed to load CMS-Flux team papers:', error);
        });
    }
  }, [modelName]);

  // Load ECCO team papers from JSON file
  useEffect(() => {
    if (modelName === 'ECCO') {
      fetch(process.env.PUBLIC_URL + '/data/ecco_team_papers.json')
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
      fetch(process.env.PUBLIC_URL + '/data/issm_team_papers.json')
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
      fetch(process.env.PUBLIC_URL + '/data/momo_chem_team_papers.json')
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
      fetch(process.env.PUBLIC_URL + '/data/cardamom_team_papers.json')
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

  // Load LES team papers from JSON file
  useEffect(() => {
    if (modelName === 'LES') {
      fetch(process.env.PUBLIC_URL + '/data/LES_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data.papers) {
            // Transform the data to match expected format
            const transformedPapers = data.papers.map(paper => ({
              authors: Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors,
              title: paper.title,
              journal: paper.venue,
              year: paper.year,
              doi: paper.doi,
              link: paper.doi ? `https://doi.org/${paper.doi}` : null
            }));
            setLesTeamPapers(transformedPapers);
          }
        })
        .catch(error => {
          console.error('Failed to load LES team papers:', error);
        });
    }
  }, [modelName]);

  // Load EDMF team papers from JSON file
  useEffect(() => {
    if (modelName === 'EDMF') {
      fetch(process.env.PUBLIC_URL + '/data/EDMF_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data.papers) {
            // Transform the data to match expected format
            const transformedPapers = data.papers.map(paper => ({
              authors: Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors,
              title: paper.title,
              journal: paper.venue,
              year: paper.year,
              doi: paper.doi,
              link: paper.doi ? `https://doi.org/${paper.doi}` : null
            }));
            setEdmfTeamPapers(transformedPapers);
          }
        })
        .catch(error => {
          console.error('Failed to load EDMF team papers:', error);
        });
    }
  }, [modelName]);

  // Load GRACE team papers from JSON file
  useEffect(() => {
    if (modelName === 'GRACE') {
      fetch(process.env.PUBLIC_URL + '/data/grace_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data.GRACE) {
            setGraceTeamPapers(data.GRACE);
          }
        })
        .catch(error => {
          console.error('Failed to load GRACE team papers:', error);
        });
    }
  }, [modelName]);

  // Load SWOT team papers from JSON file
  useEffect(() => {
    if (modelName === 'SWOT') {
      fetch(process.env.PUBLIC_URL + '/data/swot_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data.SWOT) {
            setSwotTeamPapers(data.SWOT);
          }
        })
        .catch(error => {
          console.error('Failed to load SWOT team papers:', error);
        });
    }
  }, [modelName]);

  // Load TROPESS team papers from JSON file
  useEffect(() => {
    if (modelName === 'TROPESS') {
      fetch(process.env.PUBLIC_URL + '/data/tropess_team_papers.json')
        .then(response => response.json())
        .then(data => {
          if (data.TROPESS) {
            setTropessTeamPapers(data.TROPESS);
          }
        })
        .catch(error => {
          console.error('Failed to load TROPESS team papers:', error);
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
    },
    'LES': {
      title: "Synthetic Observations of the Planetary Boundary Layer from Space: A Retrieval Observing System Simulation Experiment Framework",
      authors: "MJ Kurowski, J Teixeira, C Ao, S Brown, AB Davis, L Forster",
      journal: "Bulletin of the American Meteorological Society (2023)",
      doi: "10.1175/BAMS-D-22-0129.1",
      link: "https://doi.org/10.1175/BAMS-D-22-0129.1"
    },
    'EDMF': {
      title: "Performance of an eddy diffusivity-mass flux scheme for shallow cumulus boundary layers",
      authors: "WM Angevine, H Jiang, T Mauritsen",
      journal: "Monthly Weather Review (2010), Volume 138, Issue 7, Pages 2895-2912",
      doi: "10.1175/2010MWR3142.1",
      link: "https://doi.org/10.1175/2010MWR3142.1"
    },
    'GRACE': {
      title: "GRACE measurements of mass variability in the Earth system",
      authors: "Tapley, B. D., Bettadpur, S., Ries, J. C., Thompson, P. F., Watkins, M. M.",
      journal: "Science (2004), Volume 305, Issue 5683, Pages 503-505",
      doi: "10.1126/science.1099192",
      link: "https://doi.org/10.1126/science.1099192"
    },
    'SWOT': {
      title: "Global observations of fine-scale ocean surface topography with the Surface Water and Ocean Topography (SWOT) mission",
      authors: "Morrow, R., Fu, L.-L., Ardhuin, F., Benkiran, M., Cravatte, S., et al.",
      journal: "Frontiers in Marine Science (2019), Volume 6, Article 232",
      doi: "10.3389/fmars.2019.00232",
      link: "https://doi.org/10.3389/fmars.2019.00232"
    },
    'TROPESS': {
      title: "TROPESS/CrIS carbon monoxide profile validation with NOAA GML and ATom in situ aircraft observations",
      authors: "Worden, H., Francis, G., Kulawik, S., Bowman, K., Cady-Pereira, K., Fu, D., et al.",
      journal: "Atmospheric Measurement Techniques (2022), Volume 15, Pages 5383-5398",
      doi: "10.5194/amt-15-5383-2022",
      link: "https://doi.org/10.5194/amt-15-5383-2022"
    }
  };

  const originalPaper = modelPapers[modelName] || modelPapers['RAPID'];

  // Get the appropriate related papers for the current model
  const relatedPapers =
    (modelName === 'RAPID' && rapidTeamPapers.length > 0) ? rapidTeamPapers :
    (modelName === 'CMS-Flux' && cmsFluxTeamPapers.length > 0) ? cmsFluxTeamPapers :
    (modelName === 'ECCO' && eccoTeamPapers.length > 0) ? eccoTeamPapers :
    (modelName === 'ISSM' && issmTeamPapers.length > 0) ? issmTeamPapers :
    (modelName === 'MOMO-CHEM' && momoChemTeamPapers.length > 0) ? momoChemTeamPapers :
    (modelName === 'CARDAMOM' && cardamomTeamPapers.length > 0) ? cardamomTeamPapers :
    (modelName === 'LES' && lesTeamPapers.length > 0) ? lesTeamPapers :
    (modelName === 'EDMF' && edmfTeamPapers.length > 0) ? edmfTeamPapers :
    (modelName === 'GRACE' && graceTeamPapers.length > 0) ? graceTeamPapers :
    (modelName === 'SWOT' && swotTeamPapers.length > 0) ? swotTeamPapers :
    (modelName === 'TROPESS' && tropessTeamPapers.length > 0) ? tropessTeamPapers :
    [];

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