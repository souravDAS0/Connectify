import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, ListPlus, ListStart } from 'lucide-react';
import type { Track } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';

interface TrackContextMenuProps {
    track: Track;
}

const TrackContextMenu: React.FC<TrackContextMenuProps> = ({ track }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { addToQueue } = usePlayerStore();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleAddToQueue = (e: React.MouseEvent) => {
        e.stopPropagation();
        addToQueue(track);
        setIsOpen(false);
    };

    const handlePlayNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        // Insert track right after the current playing track
        const { queue: currentQueue, queueIndex: currentIndex } = usePlayerStore.getState();
        const newQueue = [...currentQueue];
        newQueue.splice(currentIndex + 1, 0, track);
        usePlayerStore.getState().setQueue(newQueue);
        setIsOpen(false);
    };

    const handleToggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Position menu below the button, aligned to the right
            setMenuPosition({
                top: rect.bottom + 4,
                left: rect.right - 160, // 192px = w-48 (12rem)
            });
        }

        setIsOpen(!isOpen);
    };

    const menuContent = isOpen ? (
        <div
            ref={menuRef}
            className="fixed max-w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
            style={{
                top: menuPosition.top,
                left: Math.max(8, menuPosition.left), // Ensure menu doesn't go off-screen
                zIndex: 9999,
            }}
        >
            <button
                onClick={handlePlayNext}
                className="w-full px-4 py-2 flex items-center gap-3 text-left text-gray-200 hover:bg-gray-700 transition-colors"
            >
                <ListStart size={16} className="text-gray-400" />
                <span className="text-sm">Play Next</span>
            </button>
            <button
                onClick={handleAddToQueue}
                className="w-full px-4 py-2 flex items-center gap-3 text-left text-gray-200 hover:bg-gray-700 transition-colors"
            >
                <ListPlus size={16} className="text-gray-400" />
                <span className="text-sm">Add to Queue</span>
            </button>
        </div>
    ) : null;

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleToggleMenu}
                className="p-2 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                title="More options"
            >
                <MoreVertical size={18} />
            </button>

            {/* Render menu in a portal to escape stacking context */}
            {menuContent && createPortal(menuContent, document.body)}
        </>
    );
};

export default TrackContextMenu;
