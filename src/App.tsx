/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format, subDays, startOfToday, eachDayOfInterval, lastDayOfMonth, startOfMonth, isBefore, isToday, addMonths, subMonths, isSameMonth } from 'date-fns';
import { Plus, BarChart2, Settings2, Check, X, Clock, ChevronLeft, ChevronRight, Calendar, FileText } from 'lucide-react';
import { Habit, HabitEntry, HabitStatus } from './types';
import { HabitStats } from './components/HabitStats';
import { cn } from './lib/utils';

const STORAGE_KEY = 'habit-grid-data';

export default function App() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [selectedHabitForStats, setSelectedHabitForStats] = useState<Habit | null>(null);
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{ habitId: string; date: string } | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [viewDate, setViewDate] = useState(startOfMonth(new Date()));
  const todayRef = useRef<HTMLTableRowElement>(null);

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const { habits, entries } = JSON.parse(saved);
      setHabits(habits);
      setEntries(entries);
    } else {
      // Default habits
      setHabits([
        { id: '1', name: 'Exercise', targetTime: 30 },
        { id: '2', name: 'Reading', targetTime: 20 },
        { id: '3', name: 'Meditation', targetTime: 10 },
      ]);
    }
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ habits, entries }));
  }, [habits, entries]);

  const days = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = lastDayOfMonth(viewDate);
    return eachDayOfInterval({ start, end });
  }, [viewDate]);

  // Auto-scroll to today
  const scrollToToday = () => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    if (isSameMonth(viewDate, new Date())) {
      const timer = setTimeout(scrollToToday, 200);
      return () => clearTimeout(timer);
    }
  }, [viewDate, habits]); // Re-run when month changes or habits are added/removed

  const handleAddHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const targetTime = parseInt(formData.get('targetTime') as string);

    if (name && targetTime) {
      const newHabit: Habit = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        targetTime,
      };
      setHabits([...habits, newHabit]);
      setIsAddingHabit(false);
    }
  };

  const handleUpdateHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingHabit) return;
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const targetTime = parseInt(formData.get('targetTime') as string);

    if (name && targetTime) {
      setHabits(habits.map(h => h.id === editingHabit.id ? { ...h, name, targetTime } : h));
      setEditingHabit(null);
    }
  };

  const handleDeleteHabit = (id: string) => {
    if (window.confirm('Are you sure you want to delete this habit and all its logged data?')) {
      setHabits(habits.filter(h => h.id !== id));
      setEntries(entries.filter(e => e.habitId !== id));
      setEditingHabit(null);
    }
  };

  const updateEntry = (habitId: string, date: string, status: HabitStatus, timeSpent: number, notes?: string) => {
    setEntries(prev => {
      const filtered = prev.filter(e => !(e.habitId === habitId && e.date === date));
      return [...filtered, { habitId, date, status, timeSpent, notes }];
    });
    setEditingEntry(null);
  };

  const getEntry = (habitId: string, date: string) => {
    return entries.find(e => e.habitId === habitId && e.date === date);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif italic uppercase tracking-tighter leading-none">HabitGrid</h1>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center border border-[#141414] bg-white/50">
              <button 
                onClick={() => setViewDate(prev => subMonths(prev, 1))}
                className="p-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all border-r border-[#141414]"
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-4 py-1 font-serif italic uppercase text-sm min-w-[140px] text-center">
                {format(viewDate, 'MMMM yyyy')}
              </div>
              <button 
                onClick={() => setViewDate(prev => addMonths(prev, 1))}
                className="p-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all border-l border-[#141414]"
                aria-label="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button 
              onClick={() => {
                const today = new Date();
                if (!isSameMonth(viewDate, today)) {
                  setViewDate(startOfMonth(today));
                } else {
                  scrollToToday();
                }
              }}
              className="flex items-center gap-2 border border-[#141414] px-3 py-1.5 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all font-mono text-[10px] uppercase"
            >
              <Calendar size={12} /> Today
            </button>
          </div>
        </div>
        <button 
          onClick={() => setIsAddingHabit(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 border border-[#141414] px-6 py-3 md:px-4 md:py-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all font-mono text-xs uppercase active:scale-95"
        >
          <Plus size={14} /> Add Habit
        </button>
      </header>

      <div className="overflow-auto border border-[#141414] bg-white/30 backdrop-blur-sm shadow-xl max-h-[70vh]">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-30 bg-[#E4E3E0]">
            <tr className="border-b border-[#141414]">
              <th className="p-4 border-r border-[#141414] bg-[#E4E3E0] sticky left-0 top-0 z-40 w-24 md:w-40">
                <span className="data-grid-header">Timeline</span>
              </th>
              {habits.map(habit => (
                <th key={habit.id} className="p-4 min-w-[140px] md:min-w-[160px] group relative bg-[#E4E3E0]">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <span className="data-grid-header block mb-1">Habit</span>
                      <span className="font-serif italic text-base md:text-lg uppercase leading-tight block truncate max-w-[100px] md:max-w-none">{habit.name}</span>
                      <span className="font-mono text-[9px] opacity-40 uppercase">Goal: {habit.targetTime}m</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button 
                        onClick={() => setSelectedHabitForStats(habit)}
                        className="p-2 border border-[#141414]/10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all rounded-sm active:scale-90"
                        aria-label="View Stats"
                      >
                        <BarChart2 size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingHabit(habit)}
                        className="p-2 border border-[#141414]/10 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all rounded-sm active:scale-90"
                        aria-label="Edit Habit"
                      >
                        <Settings2 size={16} />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isCurrentDay = isToday(day);
              
              return (
                <tr 
                  key={dateStr} 
                  ref={isCurrentDay ? todayRef : null}
                  className={cn(
                    "border-b border-[#141414]/10 hover:bg-[#141414]/5 transition-colors",
                    isCurrentDay && "bg-emerald-500/5"
                  )}
                >
                  <td className="p-4 border-r border-[#141414] bg-[#E4E3E0] sticky left-0 z-10">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold">{format(day, 'dd')}</span>
                      <span className="font-serif italic text-[10px] uppercase opacity-50">{format(day, 'MMM yyyy')}</span>
                    </div>
                  </td>
                  {habits.map(habit => {
                    const entry = getEntry(habit.id, dateStr);
                    const isPastDay = isBefore(day, startOfToday());
                    const isAutoFailed = isPastDay && !entry;

                    return (
                      <td 
                        key={`${habit.id}-${dateStr}`} 
                        className="p-0 data-grid-cell relative group cursor-pointer"
                        onClick={() => setEditingEntry({ habitId: habit.id, date: dateStr })}
                      >
                        <div className={cn(
                          "w-full h-20 md:h-16 transition-all duration-300 flex items-center justify-center relative",
                          entry?.status === 'done' ? "bg-emerald-500/20" : 
                          (entry?.status === 'failed' || isAutoFailed) ? "bg-rose-500/20" : 
                          "bg-transparent active:bg-[#141414]/10"
                        )}>
                          {entry?.notes && (
                            <div className="absolute top-1 right-1 opacity-40">
                              <FileText size={10} />
                            </div>
                          )}
                          {(entry || isAutoFailed) && (
                            <div className="text-center">
                              <div className={cn(
                                "font-mono text-[10px] md:text-xs font-bold",
                                entry?.status === 'done' ? "text-emerald-700" : "text-rose-700"
                              )}>
                                {entry ? `${entry.timeSpent}/${habit.targetTime}m` : `0/${habit.targetTime}m`}
                              </div>
                              <div className="text-[8px] uppercase opacity-40 font-mono">
                                {entry ? Math.round((entry.timeSpent / habit.targetTime) * 100) : 0}%
                              </div>
                            </div>
                          )}
                          {!entry && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus size={14} className="text-[#141414]/30" />
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Habit Modal */}
      {isAddingHabit && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#E4E3E0] border border-[#141414] p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-serif italic uppercase mb-6">New Habit Configuration</h2>
            <form onSubmit={handleAddHabit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-serif italic opacity-50 mb-2">Habit Designation</label>
                <input 
                  name="name" 
                  required 
                  autoFocus
                  className="w-full bg-transparent border-b border-[#141414] py-2 font-mono text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="E.G. DEEP WORK"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-serif italic opacity-50 mb-2">Target Duration (Minutes)</label>
                <input 
                  name="targetTime" 
                  type="number" 
                  required 
                  className="w-full bg-transparent border-b border-[#141414] py-2 font-mono text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="30"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 bg-[#141414] text-[#E4E3E0] py-3 font-mono text-xs uppercase hover:opacity-90 transition-opacity"
                >
                  Initialize Habit
                </button>
                <button 
                  type="button"
                  onClick={() => setIsAddingHabit(false)}
                  className="flex-1 border border-[#141414] py-3 font-mono text-xs uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Entry Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#E4E3E0] border border-[#141414] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-serif italic uppercase">Log Progress</h2>
                <p className="text-[10px] uppercase font-mono opacity-50 mt-1">
                  {habits.find(h => h.id === editingEntry.habitId)?.name} // {editingEntry.date}
                </p>
              </div>
              <button onClick={() => setEditingEntry(null)} className="p-3 -mr-2 -mt-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors active:scale-90">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-serif italic opacity-50 mb-2">Time Spent (Minutes)</label>
                <input 
                  type="number"
                  id="custom-time"
                  inputMode="numeric"
                  defaultValue={getEntry(editingEntry.habitId, editingEntry.date)?.timeSpent ?? habits.find(h => h.id === editingEntry.habitId)?.targetTime ?? 0}
                  className="w-full bg-transparent border-b border-[#141414] py-2 font-mono text-3xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-serif italic opacity-50 mb-2">Journal / Session Notes</label>
                <textarea 
                  id="entry-notes"
                  placeholder="What did you accomplish? Any obstacles?"
                  defaultValue={getEntry(editingEntry.habitId, editingEntry.date)?.notes || ''}
                  className="w-full bg-transparent border border-[#141414]/20 p-3 font-mono text-xs focus:outline-none focus:border-[#141414] min-h-[80px] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => {
                    const val = parseInt((document.getElementById('custom-time') as HTMLInputElement).value) || 0;
                    const notes = (document.getElementById('entry-notes') as HTMLTextAreaElement)?.value;
                    updateEntry(editingEntry.habitId, editingEntry.date, 'done', val, notes);
                  }}
                  className="flex flex-col items-center gap-3 border border-[#141414] p-6 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors group"
                >
                  <Check className="text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[10px] uppercase">Complete Session</span>
                </button>
                <button 
                  onClick={() => {
                    const val = parseInt((document.getElementById('custom-time') as HTMLInputElement).value) || 0;
                    const notes = (document.getElementById('entry-notes') as HTMLTextAreaElement)?.value;
                    updateEntry(editingEntry.habitId, editingEntry.date, 'failed', val, notes);
                  }}
                  className="flex flex-col items-center gap-3 border border-[#141414] p-6 bg-rose-500/5 hover:bg-rose-500/10 transition-colors group"
                >
                  <X className="text-rose-600 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[10px] uppercase">Failed Session</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#E4E3E0] border border-[#141414] p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-serif italic uppercase">Edit Habit</h2>
              <button onClick={() => setEditingHabit(null)} className="p-1 hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleUpdateHabit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-serif italic opacity-50 mb-2">Habit Designation</label>
                <input 
                  name="name" 
                  required 
                  defaultValue={editingHabit.name}
                  className="w-full bg-transparent border-b border-[#141414] py-2 font-mono text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-serif italic opacity-50 mb-2">Target Duration (Minutes)</label>
                <input 
                  name="targetTime" 
                  type="number" 
                  required 
                  defaultValue={editingHabit.targetTime}
                  className="w-full bg-transparent border-b border-[#141414] py-2 font-mono text-lg focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  type="submit"
                  className="w-full bg-[#141414] text-[#E4E3E0] py-3 font-mono text-xs uppercase hover:opacity-90 transition-opacity"
                >
                  Save Changes
                </button>
                <button 
                  type="button"
                  onClick={() => handleDeleteHabit(editingHabit.id)}
                  className="w-full border border-rose-500 text-rose-600 py-3 font-mono text-xs uppercase hover:bg-rose-500 hover:text-white transition-all"
                >
                  Delete Habit
                </button>
                <button 
                  type="button"
                  onClick={() => setEditingHabit(null)}
                  className="w-full border border-[#141414] py-3 font-mono text-xs uppercase hover:bg-[#141414] hover:text-[#E4E3E0] transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {selectedHabitForStats && (
        <HabitStats 
          habit={selectedHabitForStats} 
          entries={entries} 
          onClose={() => setSelectedHabitForStats(null)} 
        />
      )}
    </div>
  );
}
