// src/components/charts/ImpactScoreCard.js
// Impact score calculation card

import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import ScoreCalculation from '../ScoreCalculation';

const ImpactScoreCard = () => (
  <div className="bg-white rounded-lg p-5 shadow-sm h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <div className="text-base font-semibold text-gray-800">Impact Score Calculation</div>
        <div className="text-sm text-gray-500 mt-1">How the 15.2 impact score is derived</div>
      </div>
      <button className="text-gray-500 hover:text-gray-700 p-1"><MoreHorizontal size={18} /></button>
    </div>
    
    <ScoreCalculation 
      title="Citation Quality Component"
      items={[
        { factor: "Peer-reviewed journals (63)", weight: "×3.0", score: "189.0" },
        { factor: "Conference papers (28)", weight: "×1.5", score: "42.0" },
        { factor: "Technical reports (46)", weight: "×0.8", score: "36.8" },
        { factor: "Academic theses (31)", weight: "×0.7", score: "21.7" },
        { factor: "Online resources (92)", weight: "×0.1", score: "9.2" },
        { factor: "Popular press (5)", weight: "×0.4", score: "2.0" }
      ]}
    />
    
    <ScoreCalculation 
      title="Engagement Depth Multipliers"
      items={[
        { factor: "Level 4 citations (12)", weight: "×2.0", score: "+24.0" },
        { factor: "Level 3 citations (28)", weight: "×1.5", score: "+42.0" },
        { factor: "Level 2 citations (50)", weight: "×1.2", score: "+60.0" }
      ]}
    />
    
    <ScoreCalculation 
      title="Field Impact & Recency"
      items={[
        { factor: "High-impact journals", weight: "×1.5", score: "+14.2" },
        { factor: "Recent citations (2 years)", weight: "×1.3", score: "+23.9" },
        { factor: "Raw score ÷ 30", weight: "", score: "15.2" }
      ]}
    />
  </div>
);

export default ImpactScoreCard;