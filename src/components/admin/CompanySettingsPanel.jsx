import React, { useState, useEffect } from 'react';
import { apiClient } from '@/apis/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CompanySettingsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    company_name: '',
    company_description: '',
    contact_email: '',
    support_email: '',
    website_url: '',
    social_media: {
      twitter: '',
      github: '',
      discord: '',
      linkedin: ''
    },
    footer_links: []
  });

  const [newLink, setNewLink] = useState({ label: '', url: '', page: '' });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      const result = await apiClient.entities.CompanySettings.list();
      return Array.isArray(result) ? result[0] : result.list?.[0];
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        company_description: settings.company_description || '',
        contact_email: settings.contact_email || '',
        support_email: settings.support_email || '',
        website_url: settings.website_url || '',
        social_media: settings.social_media || {},
        footer_links: settings.footer_links || []
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (settings?.id) {
        await apiClient.entities.CompanySettings.update(settings.id, data);
      } else {
        await apiClient.entities.CompanySettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] });
      toast({ title: 'Success', description: 'Company settings updated' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleAddLink = () => {
    if (newLink.label && (newLink.url || newLink.page)) {
      setFormData({
        ...formData,
        footer_links: [...formData.footer_links, newLink]
      });
      setNewLink({ label: '', url: '', page: '' });
    }
  };

  const handleRemoveLink = (index) => {
    setFormData({
      ...formData,
      footer_links: formData.footer_links.filter((_, i) => i !== index)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Info */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>Manage your company details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
            <Input
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="Prompt Hub"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <Textarea
              value={formData.company_description}
              onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
              placeholder="Company description"
              className="min-h-[100px]"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
              <Input
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Support Email</label>
              <Input
                type="email"
                value={formData.support_email}
                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                placeholder="support@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
            <Input
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>Add your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          {['twitter', 'github', 'discord', 'linkedin'].map((platform) => (
            <div key={platform}>
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">{platform}</label>
              <Input
                value={formData.social_media[platform] || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  social_media: { ...formData.social_media, [platform]: e.target.value }
                })}
                placeholder={`https://${platform}.com/...`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer Links */}
      <Card>
        <CardHeader>
          <CardTitle>Footer Links</CardTitle>
          <CardDescription>Manage navigation links in the footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
            {formData.footer_links.map((link, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{link.label}</p>
                  <p className="text-sm text-gray-600">{link.url || link.page}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveLink(idx)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-gray-900">Add New Link</h4>
            <Input
              value={newLink.label}
              onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
              placeholder="Link label"
            />
            <Input
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
              placeholder="External URL (https://...)"
            />
            <Input
              value={newLink.page}
              onChange={(e) => setNewLink({ ...newLink, page: e.target.value })}
              placeholder="Or internal page name (e.g., PrivacyPolicy)"
            />
            <Button
              onClick={handleAddLink}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={!newLink.label || (!newLink.url && !newLink.page)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Link
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={updateMutation.isPending}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 py-6"
        size="lg"
      >
        {updateMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </>
        )}
      </Button>
    </div>
  );
}
