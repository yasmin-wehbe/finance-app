import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

const CommentModal = ({ isOpen, onClose, comment, date }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Snapshot Note</h3>
                        <p className="text-sm text-gray-500 mt-1">{date}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Comment Content */}
                <div className="p-6">
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                        <div className="flex gap-4 items-center">
                            <ChatBubbleLeftEllipsisIcon className="w-4 h-4 text-gray-700" />
                            <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap italic">
                                {comment || "No comment provided."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CommentModal;