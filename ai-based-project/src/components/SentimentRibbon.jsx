import React, { useMemo } from 'react';

export const SentimentRibbon = ({ sessionLog = [] }) => {
  const { segments, best30s, worst30s } = useMemo(() => {
    if (!sessionLog || sessionLog.length === 0) {
      return { segments: [], best30s: null, worst30s: null };
    }

    const segments = sessionLog.map((log) => {
      let color = "bg-amber-400"; // neutral
      if (log.confidenceScore > 0.65 && log.gazeZone === "camera") {
        color = "bg-emerald-500";
      } else if (log.confidenceScore < 0.4 || log.gazeZone !== "camera") {
        color = "bg-red-500";
      }
      return { ...log, color };
    });

    // Find best and worst 30-second windows
    const windowSize = 30; // 30 seconds (assuming 1 log per second)
    let bestAvg = -1;
    let worstAvg = 2;
    let bestStartIdx = 0;
    let worstStartIdx = 0;

    for (let i = 0; i <= segments.length - windowSize; i++) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        // Penalize looking away
        let penalty = segments[i + j].gazeZone !== "camera" ? 0.3 : 0;
        sum += (segments[i + j].confidenceScore - penalty);
      }
      const avg = sum / windowSize;
      
      if (avg > bestAvg) {
        bestAvg = avg;
        bestStartIdx = i;
      }
      if (avg < worstAvg) {
        worstAvg = avg;
        worstStartIdx = i;
      }
    }

    return {
      segments,
      best30s: bestAvg !== -1 && segments.length >= windowSize ? { start: bestStartIdx, end: bestStartIdx + windowSize } : null,
      worst30s: worstAvg !== 2 && segments.length >= windowSize ? { start: worstStartIdx, end: worstStartIdx + windowSize } : null,
    };
  }, [sessionLog]);

  if (segments.length === 0) return null;

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 mt-6">
      <h3 className="text-xl font-bold mb-4 text-white">AI Behavioral Analysis</h3>
      
      <div className="space-y-6">
        <div>
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Interview Start</span>
            <span>Interview End</span>
          </div>
          
          {/* Timeline Bar */}
          <div className="relative h-6 w-full flex rounded-sm overflow-hidden bg-gray-900 border border-gray-700">
            {segments.map((seg, i) => (
              <div 
                key={i} 
                className={`flex-1 h-full ${seg.color} opacity-80 hover:opacity-100 transition-opacity`}
                title={`Engagement: ${Math.round(seg.confidenceScore * 100)}% | Gaze: ${seg.gazeZone}`}
              />
            ))}
            
            {/* Highlights Overlays */}
            {best30s && (
              <div 
                className="absolute top-0 h-full border-t-2 border-b-2 border-emerald-300 bg-emerald-400/20 pointer-events-none"
                style={{
                  left: `${(best30s.start / segments.length) * 100}%`,
                  width: `${((best30s.end - best30s.start) / segments.length) * 100}%`
                }}
              >
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-emerald-400 whitespace-nowrap bg-gray-800 px-2 py-0.5 rounded">
                  ⭐ Best Presence
                </div>
              </div>
            )}
            
            {worst30s && (
              <div 
                className="absolute top-0 h-full border-t-2 border-b-2 border-red-400 bg-red-500/20 pointer-events-none"
                style={{
                  left: `${(worst30s.start / segments.length) * 100}%`,
                  width: `${((worst30s.end - worst30s.start) / segments.length) * 100}%`
                }}
              >
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-bold text-red-400 whitespace-nowrap bg-gray-800 px-2 py-0.5 rounded">
                  🔧 Needs Polish
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-6 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-emerald-500"></div> High Engagement & Good Eye Contact
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-amber-400"></div> Neutral / Passing
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-red-500"></div> Looked Away / Low Confidence
          </div>
        </div>
      </div>
    </div>
  );
};
