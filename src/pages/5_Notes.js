import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { DocumentTextIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

function Notes() {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Load notes on mount
    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        setLoading(true);
        try {
            const result = await window.electronAPI.readNotes();
            if (result.status === 'success') {
                setContent(result.content || '');
                setHasChanges(false);
            } else {
                console.error('Error loading notes:', result.message);
            }
        } catch (error) {
            console.error('Error loading notes:', error);
        }
        setLoading(false);
    };

    const saveNotes = async () => {
        setSaving(true);
        try {
            const result = await window.electronAPI.saveNotes(content);
            if (result.status === 'success') {
                setLastSaved(new Date());
                setHasChanges(false);
            } else {
                alert('Error saving notes: ' + result.message);
            }
        } catch (error) {
            alert('Error saving notes: ' + error);
        }
        setSaving(false);
    };

    const handleChange = (e) => {
        setContent(e.target.value);
        setHasChanges(true);
    };

    // Auto-save every 30 seconds if there are changes
    useEffect(() => {
        if (!hasChanges) return;

        const autoSaveTimer = setTimeout(() => {
            saveNotes();
        }, 30000); // 30 seconds

        return () => clearTimeout(autoSaveTimer);
    }, [content, hasChanges]);

    // Keyboard shortcut Ctrl+S / Cmd+S
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveNotes();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [content]);

    if (loading) {
        return (
            <div className="px-4 py-2">
                <PageHeader title="Notes" />
                <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                    <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Loading notes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 py-2 h-screen flex flex-col">
            <PageHeader title="Notes" />

            {/* Toolbar */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <DocumentTextIcon className="w-6 h-6 text-gray-600" />
                        <div>
                            <h3 className="text-lg font-semibold">Strategy & Ideas</h3>
                            <p className="text-xs text-gray-500">
                                Saved to: <code className="bg-gray-100 px-2 py-0.5 rounded">backend/notes.txt</code>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {lastSaved && (
                            <span className="text-sm text-gray-500">
                                Last saved: {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        
                        {hasChanges && (
                            <span className="text-sm text-orange-600 font-medium">
                                • Unsaved changes
                            </span>
                        )}

                        <button
                            onClick={saveNotes}
                            disabled={saving || !hasChanges}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                saving || !hasChanges
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {saving ? (
                                <>
                                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckIcon className="w-4 h-4" />
                                    Save Notes
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    💡 <strong>Tips:</strong> Auto-saves every 30 seconds • Press <kbd className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">Ctrl+S</kbd> / <kbd className="bg-blue-100 px-1.5 py-0.5 rounded font-mono">⌘+S</kbd> to save manually
                </div>
            </div>

            {/* Text Editor */}
            <div className="flex-1 min-h-0 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col mb-4">
                <textarea
                    value={content}
                    onChange={handleChange}
                    placeholder="Start writing your financial strategy, ideas, goals, or brainstorming notes here...

Examples:
• Investment goals for 2026
• Analysis of recent market trends
• Ideas for optimizing spending
• Long-term wealth building strategy
• Questions to research
• Important reminders"
                    className="h-full w-full p-6 resize-none outline-none font-mono text-sm leading-relaxed overflow-y-scroll"
                    style={{ minHeight: '200px' }}
                />
            </div>

            {/* Character count */}
            <div className="text-right text-xs text-gray-500 mb-2">
                {content.length.toLocaleString()} characters • {content.split('\n').length} lines
            </div>
        </div>
    );
}

export default Notes;