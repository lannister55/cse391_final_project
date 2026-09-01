import React from 'react';

const STEPS = [
  { key: 'ACCEPTED', label: 'Accepted', icon: '🤝' },
  { key: 'DRIVER_ARRIVING', label: 'Arriving', icon: '🚗' },
  { key: 'ONGOING', label: 'Commuting', icon: '🚖' },
  { key: 'COMPLETED', label: 'Finished', icon: '🏁' },
];

const TripStatusBar = ({ status }) => {
  if (status === 'CANCELLED') {
    return (
      <div className="bg-red-50 border border-red-200/50 rounded-2xl px-4 py-3 flex items-center gap-2 text-red-700">
        <span className="text-sm">⚠️</span>
        <span className="font-extrabold text-xs uppercase tracking-wider">Ride Cancelled</span>
      </div>
    );
  }

  // Find the index of the current status
  const currentStepIndex = STEPS.findIndex(step => step.key === status);
  // Default to 0 if not found (e.g. matched/pending)
  const activeIndex = currentStepIndex !== -1 ? currentStepIndex : 0;

  return (
    <div className="space-y-4">
      {/* Title Status Bar */}
      <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2 w-max">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          Current State: {STEPS[activeIndex]?.label || status}
        </span>
      </div>

      {/* Progress Steps Visualizer */}
      <div className="relative flex justify-between items-center w-full px-2">
        {/* Background connector line */}
        <div className="absolute top-[18px] left-0 right-0 h-1 bg-slate-100 rounded-full z-0" />
        
        {/* Active connector line */}
        <div 
          className="absolute top-[18px] left-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400 rounded-full z-0 transition-all duration-500 ease-out"
          style={{ width: `${(activeIndex / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          
          return (
            <div key={step.key} className="flex flex-col items-center gap-1.5 z-10 relative">
              <div 
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' 
                    : isActive 
                      ? 'bg-white border-4 border-primary-500 text-slate-800 scale-110 shadow-lg ring-4 ring-primary-100' 
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? '✓' : step.icon}
              </div>
              <span 
                className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${
                  isActive ? 'text-primary-600 font-extrabold' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TripStatusBar;