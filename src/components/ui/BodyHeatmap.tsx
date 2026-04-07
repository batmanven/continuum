import React, { useState, useMemo } from 'react';
import Model from '@phelian/react-body-highlighter';

export type BodyRegion = 
  | 'head' | 'neck' | 'trapezius' | 'upper-back' | 'lower-back' | 'chest' 
  | 'biceps' | 'triceps' | 'forearm' | 'back-deltoids' | 'front-deltoids' 
  | 'abs' | 'obliques' | 'adductor' | 'hamstring' | 'quadriceps' 
  | 'abductors' | 'calves' | 'gluteal';

export interface BodyHeatmapProps {
  heatData: Partial<Record<BodyRegion, number>>; // 0-10 severity
  onRegionHover?: (region: BodyRegion | null) => void;
  hoveredRegion?: BodyRegion | null;
  selectedRegion?: BodyRegion | null;
  onRegionClick?: (region: BodyRegion) => void;
  gender?: 'male' | 'female';
}

export const BodyHeatmap: React.FC<BodyHeatmapProps> = ({
  heatData,
  onRegionHover,
  hoveredRegion,
  selectedRegion,
  onRegionClick,
  gender = 'male'
}) => {
  const [view, setView] = useState<'anterior' | 'posterior'>('anterior');

  const data = useMemo(() => {
    const arr: { name: string; muscles: BodyRegion[] }[] = [];
    Object.entries(heatData).forEach(([region, value]) => {
        const intensity = Math.min(Math.max(Math.round((value as number)), 0), 10);
        for(let i = 0; i < intensity; i++) {
           arr.push({ name: `Heat_${region}_${i}`, muscles: [region as BodyRegion] });
        }
    });

    if (hoveredRegion || selectedRegion) {
        const highlightRegion = selectedRegion || hoveredRegion;
        for(let i = 0; i < 5; i++) {
           arr.push({ name: 'Active_Highlight', muscles: [highlightRegion as BodyRegion] });
        }
    }

    return arr;
  }, [heatData, hoveredRegion, selectedRegion]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="flex items-center justify-center mb-4 z-10 relative">
        <div className="flex bg-secondary/50 rounded-lg p-1 select-none">
          <button 
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'anterior' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setView('anterior')}
          >
            Front
          </button>
          <button 
            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'posterior' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setView('posterior')}
          >
            Back
          </button>
        </div>
      </div>

      <div className="w-full max-w-[280px] drop-shadow-sm transition-all duration-300">
          <Model
             data={data}
             type={view}
             bodyType={gender}
             onClick={(exercise: any) => {
                 if (onRegionClick && exercise && exercise.muscle) {
                     onRegionClick(exercise.muscle as BodyRegion);
                 }
             }}
             highlightedColors={['#e2e8f0', '#fef08a', '#facc15', '#f97316', '#ef4444', '#b91c1c']}
          />
      </div>
    </div>
  );
};
