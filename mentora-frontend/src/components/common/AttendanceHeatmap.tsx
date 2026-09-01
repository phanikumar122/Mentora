import React, { useState, useMemo } from 'react';
import { CalendarCheck, Flame, Award, TrendingUp, Info } from 'lucide-react';

export interface HeatmapDay {
  date: string; // YYYY-MM-DD
  count: number;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  intensityLevel: number; // 0, 1, 2, 3, 4
}

interface AttendanceHeatmapProps {
  data: HeatmapDay[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

export const AttendanceHeatmap: React.FC<AttendanceHeatmapProps> = ({
  data,
  title = 'Academic Attendance Activity Heatmap',
  subtitle = 'Daily session attendance & compliance density over the current semester',
  loading = false,
}) => {
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  // Group into 7-day columns (weeks)
  const { weeks, stats, monthLabels } = useMemo(() => {
    if (!data || data.length === 0) {
      return { weeks: [], stats: { totalDays: 0, presentDays: 0, streak: 0, rate: 100 }, monthLabels: [] };
    }

    // Sort data chronologically
    const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate streaks and totals
    let totalDays = 0;
    let presentDays = 0;
    let currentStreak = 0;
    let maxStreak = 0;

    sorted.forEach((d) => {
      if (d.count > 0) {
        totalDays++;
        if ((d.presentCount || 0) > 0 || d.intensityLevel >= 2) {
          presentDays++;
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else {
          currentStreak = 0;
        }
      }
    });

    const overallRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 1000) / 10 : 100;

    // Pad the start to align with the first day's day-of-week (0 = Sunday, 1 = Monday, ...)
    const firstDate = new Date(sorted[0].date);
    const startDayOfWeek = firstDate.getDay(); // 0 is Sunday

    const paddedList: (HeatmapDay | null)[] = Array(startDayOfWeek).fill(null);
    sorted.forEach((d) => paddedList.push(d));

    // Chunk into 7-day columns
    const weekChunks: (HeatmapDay | null)[][] = [];
    for (let i = 0; i < paddedList.length; i += 7) {
      weekChunks.push(paddedList.slice(i, i + 7));
    }

    // Generate Month Labels
    const mLabels: { text: string; weekIndex: number }[] = [];
    let lastMonth = -1;

    weekChunks.forEach((week, wIdx) => {
      const validDay = week.find((d) => d !== null);
      if (validDay) {
        const dObj = new Date(validDay.date);
        const m = dObj.getMonth();
        if (m !== lastMonth) {
          lastMonth = m;
          mLabels.push({
            text: dObj.toLocaleString('default', { month: 'short' }),
            weekIndex: wIdx,
          });
        }
      }
    });

    return {
      weeks: weekChunks,
      stats: {
        totalDays,
        presentDays,
        streak: maxStreak,
        rate: overallRate,
      },
      monthLabels: mLabels,
    };
  }, [data]);

  const getColorClass = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-emerald-500 shadow-sm shadow-emerald-500/40 hover:ring-2 hover:ring-emerald-300';
      case 3:
        return 'bg-emerald-600/80 hover:ring-2 hover:ring-emerald-400';
      case 2:
        return 'bg-emerald-700/60 dark:bg-emerald-800/80 hover:ring-2 hover:ring-emerald-500';
      case 1:
        return 'bg-amber-500/70 hover:ring-2 hover:ring-amber-300';
      default:
        return 'bg-slate-200/70 dark:bg-slate-800/80 hover:bg-slate-300 dark:hover:bg-slate-700';
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl space-y-5 border border-slate-200/60 dark:border-slate-800 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <CalendarCheck className="w-4 h-4 text-emerald-500" />
            <span>{title}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center space-x-2">
          <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold flex items-center space-x-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats.rate}% Rate</span>
          </div>
          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs font-bold flex items-center space-x-1.5">
            <Flame className="w-3.5 h-3.5" />
            <span>{stats.streak} Day Streak</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading attendance activity heatmap...</div>
      ) : weeks.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">No attendance data recorded yet.</div>
      ) : (
        <div className="space-y-3">
          {/* Month Header row */}
          <div className="overflow-x-auto pb-2">
            <div className="inline-block min-w-full">
              <div className="flex text-[10px] text-slate-400 font-semibold mb-1 pl-8">
                {monthLabels.map((m, idx) => (
                  <div
                    key={idx}
                    style={{ marginLeft: idx === 0 ? `${m.weekIndex * 15}px` : `${Math.max(10, (m.weekIndex - (monthLabels[idx - 1]?.weekIndex || 0)) * 14 - 20)}px` }}
                  >
                    {m.text}
                  </div>
                ))}
              </div>

              {/* Heatmap Grid & Day Labels */}
              <div className="flex items-start space-x-2">
                {/* Day of week labels */}
                <div className="flex flex-col space-y-[3px] text-[9px] font-semibold text-slate-400 pr-1 select-none pt-0.5">
                  <span className="h-[12px]">Sun</span>
                  <span className="h-[12px]">Mon</span>
                  <span className="h-[12px]">Tue</span>
                  <span className="h-[12px]">Wed</span>
                  <span className="h-[12px]">Thu</span>
                  <span className="h-[12px]">Fri</span>
                  <span className="h-[12px]">Sat</span>
                </div>

                {/* Week Columns */}
                <div className="flex space-x-[3px]">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex flex-col space-y-[3px]">
                      {Array.from({ length: 7 }).map((_, dIdx) => {
                        const day = week[dIdx];
                        if (!day) {
                          return (
                            <div
                              key={dIdx}
                              className="w-[12px] h-[12px] rounded-[3px] opacity-0"
                            />
                          );
                        }

                        return (
                          <div
                            key={day.date}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                            className={`w-[12px] h-[12px] rounded-[3px] transition-all cursor-pointer ${getColorClass(day.intensityLevel)}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bar with Hover Tooltip & Legend */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
            <div className="text-slate-500 dark:text-slate-400 text-[11px] min-h-[20px] flex items-center space-x-1.5">
              {hoveredDay ? (
                <span className="font-medium">
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    {new Date(hoveredDay.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </strong>
                  : {hoveredDay.count > 0 ? (
                    <>
                      <span className="text-emerald-500 font-bold ml-1">{hoveredDay.presentCount || 0} Present</span>
                      {(hoveredDay.lateCount || 0) > 0 && <span className="text-amber-500 font-bold ml-1">({hoveredDay.lateCount} Late)</span>}
                      {(hoveredDay.absentCount || 0) > 0 && <span className="text-rose-500 font-bold ml-1">({hoveredDay.absentCount} Absent)</span>}
                    </>
                  ) : (
                    <span className="text-slate-400 ml-1">No scheduled sessions</span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400 flex items-center space-x-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>Hover over any tile to view daily session breakdown</span>
                </span>
              )}
            </div>

            {/* Intensity Legend */}
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-medium self-end sm:self-auto">
              <span>Less</span>
              <div className="w-[11px] h-[11px] rounded-[2px] bg-slate-200 dark:bg-slate-800" title="No activity" />
              <div className="w-[11px] h-[11px] rounded-[2px] bg-amber-500/70" title="Low / Absent" />
              <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-700/60" title="Moderate attendance" />
              <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-600/80" title="Good attendance" />
              <div className="w-[11px] h-[11px] rounded-[2px] bg-emerald-500" title="100% Present" />
              <span>More</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
