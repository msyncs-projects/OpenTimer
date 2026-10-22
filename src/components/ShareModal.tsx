'use client';

import React, { useState } from 'react';
import { Workout } from '@/types/workout';
import { exportWorkoutsAsJson, importWorkoutsFromJson, encodeWorkoutForUrl } from '@/lib/storage';
import { X, Copy, Check, Download, Upload, Share2, Link as LinkIcon } from 'lucide-react';

interface ShareModalProps {
  workout?: Workout | null;
  onImportSuccess: () => void;
  onClose: () => void;
}

export function ShareModal({ workout, onImportSuccess, onClose }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState('');
  const [activeTab, setActiveTab] = useState<'link' | 'backup'>('link');

  // Generate share link
  const shareUrl = typeof window !== 'undefined' && workout
    ? `${window.location.origin}/?w=${encodeWorkoutForUrl(workout)}`
    : '';

  const copyShareLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const copyBackupJson = async () => {
    try {
      const json = exportWorkoutsAsJson();
      await navigator.clipboard.writeText(json);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleImport = () => {
    setImportError('');
    if (!importJsonText.trim()) return;
    try {
      importWorkoutsFromJson(importJsonText.trim());
      onImportSuccess();
      onClose();
    } catch (e) {
      setImportError('Invalid workout JSON format. Please check and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150 safe-area-all">
      <div className="w-full sm:max-w-md bg-neutral-900 border border-neutral-800 rounded-t-[32px] sm:rounded-[32px] p-5 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-green-400" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              Share & Backup
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-950 rounded-2xl border border-neutral-800">
          <button
            type="button"
            onClick={() => setActiveTab('link')}
            className={`py-2 rounded-xl text-xs font-black uppercase transition ${
              activeTab === 'link' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Share Workout
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2 rounded-xl text-xs font-black uppercase transition ${
              activeTab === 'backup' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Backup / Import
          </button>
        </div>

        {activeTab === 'link' && workout ? (
          <div className="space-y-4 pt-1">
            <div className="p-3 bg-neutral-950 rounded-2xl border border-neutral-800 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-500">
                WORKOUT
              </span>
              <div className="text-base font-black text-white">{workout.name}</div>
              <div className="text-xs text-neutral-400">
                {workout.rounds.length} rounds • {workout.cycles} cycles
              </div>
            </div>

            <p className="text-xs text-neutral-400">
              Anyone who opens this link on their phone or computer can immediately run or save this custom workout!
            </p>

            <button
              type="button"
              onClick={copyShareLink}
              className="w-full py-3.5 bg-green-500 hover:bg-green-400 text-black font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition flex items-center justify-center gap-2"
            >
              {copiedLink ? <Check className="w-5 h-5 stroke-[3]" /> : <LinkIcon className="w-5 h-5" />}
              {copiedLink ? 'Link Copied!' : 'Copy Shareable Link'}
            </button>
          </div>
        ) : activeTab === 'link' && !workout ? (
          <div className="p-6 text-center text-sm text-neutral-400">
            Select a workout from your list to generate a share link.
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            {/* Backup Export */}
            <div className="p-3.5 bg-neutral-950 rounded-2xl border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-black uppercase text-white">Export All Workouts</div>
                <div className="text-[10px] text-neutral-400">Copy JSON backup to clipboard</div>
              </div>
              <button
                type="button"
                onClick={copyBackupJson}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center gap-1 active:scale-95"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedJson ? 'Copied' : 'Export'}
              </button>
            </div>

            {/* Import JSON */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                IMPORT WORKOUTS (PASTE JSON)
              </label>
              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder="Paste workout JSON backup here..."
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-3 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 resize-none"
              />
              {importError && (
                <div className="text-xs text-red-400 font-semibold">{importError}</div>
              )}
              <button
                type="button"
                onClick={handleImport}
                disabled={!importJsonText.trim()}
                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white font-black uppercase text-xs tracking-wider rounded-2xl active:scale-95 transition"
              >
                Import Workouts
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
