import React, { useState } from 'react';
import { apiClient } from '@/apis/client';
import { X, Save, User, Mail, Clock, Upload, Camera } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function AccountModal({ onClose, user }) {
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    timezone: user.timezone || 'America/New_York',
    avatar_url: user.avatar_url || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showToast, setShowToast] = useState('');
  
  const queryClient = useQueryClient();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      showToastMessage('Please select a valid image file.');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToastMessage('Image must be smaller than 5MB.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file });
      handleInputChange('avatar_url', file_url);
      showToastMessage('Photo uploaded successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToastMessage('Failed to upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiClient.auth.updateMe({
        bio: formData.bio,
        timezone: formData.timezone,
        avatar_url: formData.avatar_url
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      showToastMessage('Profile updated successfully!');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Error updating profile:', error);
      showToastMessage('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const showToastMessage = (message) => {
    setShowToast(message);
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const getInitials = (name) => {
    if (!name) return '';
    const nameParts = name.split(' ');
    if (nameParts.length > 1 && nameParts[0] && nameParts[nameParts.length - 1]) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    return '';
  };

  // Common timezone options
  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Pacific/Auckland'
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(10, 10, 10, 0.28)', backdropFilter: 'blur(4px)' }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto"
        style={{ 
          borderRadius: '24px',
          padding: '32px'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-gray-900" style={{ fontSize: '32px', fontWeight: 700 }}>
            My Account
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* User Info Section with Photo Upload */}
        <div className="mb-8 p-6 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xl">
                  {getInitials(user.full_name || user.email)}
                </div>
              )}
              
              {/* Photo Upload Button */}
              <label className="absolute -bottom-2 -right-2 bg-white border-2 border-gray-300 rounded-full p-1.5 cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                  disabled={isUploadingPhoto}
                />
                {isUploadingPhoto ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-4 h-4 text-gray-600" />
                )}
              </label>
            </div>
            
            <div>
              <h3 className="font-bold text-lg text-gray-900">{user.full_name || 'No Name'}</h3>
              <div className="flex items-center gap-1 text-gray-600 text-sm">
                <Mail className="w-4 h-4" />
                {user.email}
              </div>
              <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                <User className="w-3 h-3" />
                Role: {user.role || 'User'}
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Your name and email are managed by Google and cannot be changed here. Click the camera icon to upload a custom profile photo.
          </p>
        </div>

        {/* Editable Fields */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-gray-900 font-medium mb-2 subtitle">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us about yourself and your content..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
              maxLength={300}
            />
            <div className="text-right text-xs text-gray-500 mt-1">
              {formData.bio.length}/300
            </div>
          </div>

          <div>
            <label className="block text-gray-900 font-medium mb-2 subtitle">
              <Clock className="inline w-4 h-4 mr-1" />
              Timezone
            </label>
            <select
              value={formData.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>
                  {tz.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving || isUploadingPhoto}
          className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? (
            'Saving...'
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {showToast && (
        <div className="fixed bottom-5 right-5 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium z-50">
          {showToast}
        </div>
      )}
    </div>
  );
}
