import React, { useMemo, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format, subDays, parseISO, isSameDay, compareDesc } from 'date-fns';
import { Habit, HabitEntry } from '../types';
import { X, FileText } from 'lucide-react';

interface HabitStatsProps {
  habit: Habit;
  entries: HabitEntry[];
  onClose: () => void;
}

export const HabitStats: React.FC<HabitStatsProps> = ({ habit, entries, onClose }) => {
  const last30Days = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entry = entries.find(e => e.habitId === habit.id && e.date === dateStr);
      days.push({
        date: format(date, 'MMM dd'),
        timeSpent: entry?.timeSpent || 0,
        target: habit.targetTime,
        status: entry?.status || 'none'
      });
    }
    return days;
  }, [habit, entries]);

  const journalEntries = useMemo(() => {
    return entries
      .filter(e => e.habitId === habit.id && e.notes && e.notes.trim() !== '')
      .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));
  }, [habit, entries]);

  const completionRate = useMemo(() => {
    const habitEntries = entries.filter(e => e.habitId === habit.id);
    if (habitEntries.length === 0) return 0;
    const done = habitEntries.filter(e => e.status === 'done').length;
    return Math.round((done / habitEntries.length) * 100);
  }, [habit, entries]);

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#E4E3E0] border border-[#141414] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-[#141414]">
          <div>
            <h2 className="text-xl md:text-2xl font-serif italic uppercase tracking-wider">{habit.name}</h2>
            <p className="text-[10px] md:text-xs opacity-60 uppercase mt-1">Performance Analytics</p>
          </div>
          <button onClick={onClose} className="p-3 md:p-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors active:scale-90">
            <X size={24} className="md:w-5 md:h-5" />
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[#141414] p-4">
              <p className="text-[10px] uppercase opacity-50 font-serif italic">Completion Rate</p>
              <p className="text-3xl font-mono mt-2">{completionRate}%</p>
            </div>
            <div className="border border-[#141414] p-4">
              <p className="text-[10px] uppercase opacity-50 font-serif italic">Target Time</p>
              <p className="text-3xl font-mono mt-2">{habit.targetTime}m</p>
            </div>
            <div className="border border-[#141414] p-4">
              <p className="text-[10px] uppercase opacity-50 font-serif italic">Total Entries</p>
              <p className="text-3xl font-mono mt-2">{entries.filter(e => e.habitId === habit.id).length}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs uppercase font-serif italic opacity-60">Time Spent vs Target (Last 30 Days)</h3>
            <div className="h-[250px] md:h-[300px] w-full border border-[#141414] p-2 md:p-4 bg-white/50">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last30Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#141414" opacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#141414" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#141414" 
                    fontSize={10} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#E4E3E0', 
                      border: '1px solid #141414',
                      fontFamily: 'monospace',
                      fontSize: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="timeSpent" 
                    stroke="#141414" 
                    strokeWidth={2} 
                    dot={{ r: 3, fill: '#141414' }}
                    name="Minutes Spent"
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="target" 
                    stroke="#141414" 
                    strokeDasharray="5 5" 
                    opacity={0.3}
                    dot={false}
                    name="Target"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {journalEntries.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs uppercase font-serif italic opacity-60">Journal History</h3>
              <div className="space-y-3">
                {journalEntries.map((entry, idx) => (
                  <div key={idx} className="border border-[#141414] p-4 bg-white/30">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-[10px] uppercase opacity-50">{format(parseISO(entry.date), 'MMMM dd, yyyy')}</span>
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 border border-[#141414]">{entry.timeSpent}m</span>
                    </div>
                    <p className="font-mono text-xs whitespace-pre-wrap leading-relaxed">{entry.notes}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
