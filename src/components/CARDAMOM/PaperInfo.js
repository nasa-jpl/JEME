// src/components/PaperInfo.js
// Information about the original RAPID paper and related citations

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const PaperInfo = () => {
  const [expanded, setExpanded] = useState(false);

  // Original paper data
  const originalPaper = {
    title: "River network routing on the NHDPlus dataset",
    authors: "Cédric H. David, David R. Maidment, Guo-Yue Niu, Zong-Liang Yang, Florence Habets, Victor Eijkhout",
    journal: "Journal of Hydrometeorology (2011), Volume 12, Issue 5, Pages 913-934",
    doi: "10.1175/2011JHM1345.1",
    link: "http://dx.doi.org/10.1175/2011JHM1345.1"
  };

  // Related papers data
  const relatedPapers = [
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
  ];

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
            <span>Hide Citations</span>
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
          <div className="text-sm font-medium text-blue-800 mb-2">Papers Citing the RAPID Model:</div>
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