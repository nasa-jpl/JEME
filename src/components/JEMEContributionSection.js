// JEMEContributionSection - Tabbed section showing Technical and Public contribution paragraphs
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const JEMEContributionSection = () => {
  const [activeTab, setActiveTab] = useState('public'); // 'public' or 'technical'
  const [expanded, setExpanded] = useState(false);

  const technicalParagraphs = [
    "JPL's Earth system modeling efforts integrate multi-mission satellite datasets with advanced numerical models to generate comprehensive depictions of Earth's climate system. Through data assimilation techniques and retrospective analyses, we produce consistent datasets that cover the ocean, atmosphere, land, and cryosphere, enabling researchers to examine how these components interact over time. These model-based reconstructions (reanalyses) are rigorously evaluated against observations to ensure they reproduce the Earth system in a physically consistent manner. The outcome is a suite of Earth data products and simulations that support NASA's strategic objective of understanding Earth's changing environment and provide a foundation for improving climate predictions and resource management strategies.",

    "A key strength of JPL is the breadth of its Earth system modeling capabilities, spanning oceanography, glaciology, atmospheric chemistry, hydrology, and biogeochemistry. Dedicated modeling systems - such as ECCO for ocean circulation and climate, ISSM for ice sheets, CMS-Flux for carbon fluxes, and other frameworks for river flow (RAPID), land-atmosphere exchange (CARDAMOM), and boundary-layer clouds (EDMF) - collectively enable a holistic simulation of Earth's behavior. Each component model ingests relevant satellite observations (e.g. altimetry, gravimetry, spectrometry) through assimilation, ensuring that model estimates remain anchored to observed reality. This integrated approach allows JPL to investigate cross-domain feedbacks (for instance, how ocean heat uptake influences ice sheet melt or how terrestrial water loss affects atmospheric CO2) in a consistent framework. The result is a more complete understanding of Earth system processes and improved consistency across the datasets that NASA provides to researchers and policy-makers.",

    "Data assimilation is at the core of JPL's modeling enterprise: by mathematically combining observations with model physics, we produce optimally constrained estimates of the Earth system state. JPL has pioneered such techniques across domains - for instance, optimizing CO2 surface fluxes with a 4D-Var atmospheric inversion in CMS-Flux, or jointly assimilating multi-sensor satellite data in a chemical transport model to create a tropospheric composition reanalysis. These efforts yield refined datasets that capture both large-scale patterns and process-level details (such as carbon sources/sinks or aerosol-cloud interactions) with improved accuracy. Beyond providing initial conditions for forecasts, our assimilation-based products allow scientists to diagnose the mechanisms behind observed changes by confronting model dynamics with real-world data. This deepens understanding of climate processes and improves the predictive skill of both our models and those used in national and international climate assessments.",

    "JPL's modeling systems place a premium on physical consistency and closure of Earth's budgets. By construction, many of our data-assimilative models (e.g. the ECCO ocean-sea-ice state estimate) enforce conservation of properties like heat, freshwater, and momentum, yielding datasets that respect fundamental physics and provide self-consistent depictions of the Earth system. In practice, this means disparate observations - from satellite altimeters to gravity measurements - are reconciled in a single framework, reducing errors and biases. The physically balanced nature of these model estimates makes them especially valuable for diagnosing subtle climate signals; for instance, scientists can use them to track where excess heat in the climate system is stored or how water is redistributed among ocean, atmosphere, and land with greater confidence. In essence, JPL's models serve as a rigorous scientific interpolation tool, seamlessly connecting the dots between observations in space and time to support both NASA satellite validation and advanced Earth system research.",

    "JPL actively contributes to global modeling collaborations and assessment efforts. Our models and expertise have been integrated into international projects (for example, JPL glaciologists lead development of ice-sheet models for ISMIP6 sea-level projections, and JPL atmospheric scientists co-develop chemistry reanalyses used by WMO assessments). The outputs of JPL's modeling systems (e.g. ECCO ocean state estimates or top-down carbon fluxes) are openly disseminated and often serve as benchmarks for other models. Many are incorporated into multi-model archives and climate services, extending their reach beyond NASA. By providing reliable, observation-constrained simulations, JPL helps elevate the fidelity of global climate models and reduces uncertainties in areas ranging from ocean heat uptake to the carbon budget - directly feeding into synthesis efforts like the IPCC reports and the Global Carbon Project."
  ];

  const publicParagraphs = [
    "JPL's Earth system modeling team serves as a bridge between NASA's satellites and our understanding of the planet. We gather huge volumes of data from space - such as ocean temperatures, ice sheet movements, atmospheric gases, and soil moisture - and feed them into computer models that simulate Earth's behavior. This approach allows scientists to see how different parts of Earth (the ocean, air, land, and ice) work together and to replay past changes through reanalysis, giving us insight into events like El Niño or decades of ice loss. By blending observations and physics in this way, we can better explain why certain changes are happening and improve our ability to predict future environmental conditions. Ultimately, this helps NASA and the world make more informed decisions about climate resilience and resource management.",

    "JPL's modeling portfolio covers virtually every aspect of Earth's climate system. For example, one team models the oceans to map currents and heat storage, another models the polar ice sheets to project sea-level changes, and others focus on the flow of carbon through ecosystems or the quality of the air we breathe. What makes this effort special is that each of these models is fed with real data from NASA's satellites - measuring everything from the height of the seas to the concentration of carbon dioxide - so the simulations closely match reality. By uniting these diverse models, JPL can study how different pieces of the Earth system influence one another, such as how ocean warming affects ice loss or how drought impacts the carbon cycle. This collective approach not only helps NASA tackle big questions about climate change and natural hazards, but also provides the wider scientific community with integrated tools to understand our planet.",

    "For decades, NASA's satellites have been watching Earth, and JPL's models help make sense of this trove of history - and what it means for tomorrow. One important contribution of our modeling is creating \"reanalyses\" - essentially, playbacks of Earth's recent history - by blending past observations with models to see how events unfolded. These reconstructions, whether of ocean conditions, atmospheric composition, or land ecosystems, give scientists a reliable record of changes like ocean warming trends or regional greenhouse gas fluctuations that would be impossible to get from raw data alone. Using these as a foundation, JPL's models can also experiment with different scenarios (for example, how changing emissions or melting ice might influence future climate) to improve forecasts. In this way, our work turns massive data streams into knowledge about climate patterns and extreme events, helping society anticipate and adapt to changes ahead.",

    "One of the biggest strengths of JPL's Earth system models is their credibility - they're designed to obey the same physical laws that govern the real world. Every simulation is checked against measurements from NASA satellites and other sources, which means our ocean and climate reanalyses closely match actual observations of sea level, temperature, and other key variables. Where satellites provide only snapshots, these models can fill in the gaps (such as conditions deep underwater or in remote polar regions) and ensure nothing is \"off balance\" - for example, the water that evaporates from the ocean in the model eventually falls as rain, just as it should in nature. By building models this way, JPL provides scientific results people can trust, whether it's an explanation of why a drought is happening or a projection of how much sea levels could rise. This reliability is crucial for NASA's mission of monitoring Earth's vital signs and gives everyone from engineers to policymakers a solid foundation of facts about our changing planet.",

    "For the global science community, JPL's Earth system models are a valuable resource. We openly share the results of our modeling - such as reanalysis datasets of ocean currents or atmospheric greenhouse gases - so researchers everywhere can use them to study climate and environmental changes. JPL scientists often collaborate with other teams around the world, contributing our expertise and data to projects like the Intergovernmental Panel on Climate Change (IPCC) assessments that inform international climate policy. By providing high-quality, satellite-informed simulations and Earth data records, we help ensure that knowledge about our planet is based on the best available evidence. This spirit of collaboration and open science amplifies NASA's impact, turning our local modeling achievements into global progress in understanding and protecting Earth."
  ];

  const currentParagraphs = activeTab === 'technical' ? technicalParagraphs : publicParagraphs;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-3">About JEME</h2>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('public')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'public'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Public
          </button>
          <button
            onClick={() => setActiveTab('technical')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'technical'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Technical
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="text-gray-700 space-y-4">
        {/* First paragraph always shown */}
        <p className="leading-relaxed">{currentParagraphs[0]}</p>

        {/* Additional paragraphs shown when expanded */}
        {expanded && (
          <>
            {currentParagraphs.slice(1).map((paragraph, index) => (
              <p key={index + 1} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </>
        )}
      </div>

      {/* Expand/Collapse button */}
      <div className="mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {expanded ? 'Show Less' : 'Learn More'}
        </button>
      </div>
    </div>
  );
};

export default JEMEContributionSection;
