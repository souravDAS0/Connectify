import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical, ListPlus, ListStart, ListMusic, ChevronRight, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Track } from '../types';
import { usePlayerStore } from '../store/usePlayerStore';
import { getPlaylists, addTrackToPlaylist } from '../api/playlists';
import toast from 'react-hot-toast';

interface TrackContextMenuProps {
    track: Track;
}

const TrackContextMenu: React.FC<TrackContextMenuProps> = ({ track }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showPlaylistSubmenu, setShowPlaylistSubmenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const { addToQueue } = usePlayerStore();
    const queryClient = useQueryClient();

    const { data: playlists } = useQuery({
        queryKey: ['playlists'],
        queryFn: getPlaylists,
        enabled: isOpen, // Only fetch when menu is open
    });

    const addToPlaylistMutation = useMutation({
        mutationFn: ({ playlistId, trackId }: { playlistId: string; trackId: string }) =>
            addTrackToPlaylist(playlistId, trackId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['playlists'] });
            toast.success('Added to playlist!');
        },
        onError: () => {
            toast.error('Failed to add to playlist');
        },
    });

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setShowPlaylistSubmenu(false);
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

    const handleAddToPlaylist = (e: React.MouseEvent, playlistId: string) => {
        e.stopPropagation();
        addToPlaylistMutation.mutate({ playlistId, trackId: track.id });
        setIsOpen(false);
        setShowPlaylistSubmenu(false);
    };

    const handleToggleMenu = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            // Position menu below the button, aligned to the right
            setMenuPosition({
                top: rect.bottom + 4,
                left: rect.right - 200,
            });
        }

        setIsOpen(!isOpen);
        setShowPlaylistSubmenu(false);
    };

    const menuContent = isOpen ? (
        <div
            ref={menuRef}
            className="fixed w-52 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-visible"
            style={{
                top: menuPosition.top,
                left: Math.max(8, menuPosition.left),
                zIndex: 9999,
            }}
        >
            <button
                onClick={handlePlayNext}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-gray-200 hover:bg-gray-700 transition-colors"
            >
                <ListStart size={16} className="text-gray-400" />
                <span className="text-sm">Play Next</span>
            </button>
            <button
                onClick={handleAddToQueue}
                className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-gray-200 hover:bg-gray-700 transition-colors"
            >
                <ListPlus size={16} className="text-gray-400" />
                <span className="text-sm">Add to Queue</span>
            </button>

            {/* Divider */}
            <div className="border-t border-gray-700 my-1" />

            {/* Add to Playlist with submenu */}
            <div
                className="relative"
                onMouseEnter={() => setShowPlaylistSubmenu(true)}
                onMouseLeave={() => setShowPlaylistSubmenu(false)}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowPlaylistSubmenu(!showPlaylistSubmenu);
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between text-left text-gray-200 hover:bg-gray-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <ListMusic size={16} className="text-gray-400" />
                        <span className="text-sm">Add to Playlist</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-500" />
                </button>

                {/* Playlist Submenu */}
                {showPlaylistSubmenu && (
                    <div
                        className="absolute left-full top-0 ml-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                        style={{ zIndex: 10000 }}
                    >
                        {playlists && playlists.length > 0 ? (
                            playlists.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    onClick={(e) => handleAddToPlaylist(e, playlist.id)}
                                    className="w-full px-4 py-2.5 flex items-center gap-3 text-left text-gray-200 hover:bg-gray-700 transition-colors"
                                >
                                    <ListMusic size={14} className="text-gray-400 flex-shrink-0" />
                                    <span className="text-sm truncate">{playlist.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                <Plus size={16} className="mx-auto mb-1 opacity-50" />
                                No playlists yet
                            </div>
                        )}
                    </div>
                )}
            </div>
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

