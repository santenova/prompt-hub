import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Copy, Trash2, Box, BrainCircuit, Clapperboard, Edit, ImageIcon, Star } from 'lucide-react';
import { groupBy } from 'lodash';

// Mapping source modules to icons and display names
const moduleInfo = {
  'Title Generator': { icon: <Edit className="w-5 h-5 text-orange-500" />, name: 'Titles' },
  'Hook Generator': { icon: <BrainCircuit className="w-5 h-5 text-green-500" />, name: 'Hooks' },
  'Content Splitter': { icon: <Clapperboard className="w-5 h-5 text-blue-500" />, name: 'Split Content' },
  'Visual Mockups': { icon: <ImageIcon className="w-5 h-5 text-purple-500" />, name: 'Mockups' },
  'Idea Rating': { icon: <Star className="w-5 h-5 text-yellow-500" />, name: 'Rated Ideas' },
  'default': { icon: <Box className="w-5 h-5 text-gray-500" />, name: 'General' }
};

export default function MyLibraryModal({ onClose }) {
  const queryClient = useQueryClient();
  const [showToast, setShowToast] = useState('');

  const { data: libraryItems, isLoading } = useQuery({
    queryKey: ['libraryItems'],
    queryFn: () => apiClient.entities.LibraryItem.list('-created_date'),
    initialData: []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.LibraryItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['libraryItems'] });
      showToastMessage('Item deleted');
    },
    onError: () => {
      showToastMessage('Failed to delete item');
    }
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showToastMessage('Copied to clipboard');
    } catch (err) {
      showToastMessage('Failed to copy');
    }
  };
  
  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 2500);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const groupedItems = groupBy(libraryItems, 'source_module');
  const orderedGroups = Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white max-w-4xl w-full mx-4 shadow-xl max-h-[90vh] flex flex-col"
        style={{ 
          borderRadius: '24px',
        }}
      >
        <div className="p-8 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700 }}>
              My Library
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <p className="text-gray-600 mt-1 subtitle">All your saved content in one place.</p>
        </div>

        <div className="overflow-y-auto p-8">
          {isLoading ? (
            <div className="text-center py-10">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your library...</p>
            </div>
          ) : libraryItems.length === 0 ? (
            <div className="text-center py-16 px-6 border-2 border-dashed border-gray-200 rounded-lg">
              <Box className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Your library is empty</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start using the tools and save your favorite content here for later.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {orderedGroups.map(groupName => {
                const info = moduleInfo[groupName] || moduleInfo['default'];
                return (
                  <div key={groupName}>
                    <div className="flex items-center gap-3 mb-4">
                      {info.icon}
                      <h3 className="text-xl font-bold text-gray-800">{info.name}</h3>
                      <span className="text-sm bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                        {groupedItems[groupName].length}
                      </span>
                    </div>
                    <div className="space-y-4">
                      {groupedItems[groupName].map(item => (
                        <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
                          <h4 className="font-semibold text-gray-900 mb-2 truncate">{item.title || 'Untitled'}</h4>
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">{item.content}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{new Date(item.created_date).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleCopy(item.content)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors">
                                <Copy className="w-3.5 h-3.5" />
                                Copy
                              </button>
                              <button onClick={() => handleDelete(item.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-full hover:bg-red-100 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-medium z-50">
          {showToast}
        </div>
      )}
    </div>
  );
}
