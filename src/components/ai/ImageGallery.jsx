import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/apis/client';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Download,
  Copy,
  Star,
  StarOff,
  Search,
  Calendar,
  Tag,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Archive
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ImageGallery() {
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [displayLimit, setDisplayLimit] = useState(50);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiClient.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    filterImages();
  }, [searchQuery, images]);

  const loadImages = async () => {
    try {
      setLoading(true);
      // Load all users with their images (fetch up to 5000)
      const users = await apiClient.entities.User.list('-created_date', 5000);
      const allImages = users.flatMap(user => 
        (user.generated_images || []).map(img => ({
          ...img,
          user_name: user.full_name,
          user_email: user.email
        }))
      ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      
      setImages(allImages);
      setFilteredImages(allImages);
    } catch (error) {
      console.error('Failed to load images:', error);
      toast({
        title: "Load Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterImages = () => {
    if (!searchQuery.trim()) {
      setFilteredImages(images);
      setDisplayLimit(50);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = images.filter(img => 
      img.prompt?.toLowerCase().includes(query) ||
      img.style?.toLowerCase().includes(query) ||
      img.persona_name?.toLowerCase().includes(query) ||
      img.project_name?.toLowerCase().includes(query) ||
      img.tags?.some(tag => tag.toLowerCase().includes(query))
    );
    setFilteredImages(filtered);
    setDisplayLimit(50);
  };

  const toggleFavorite = async (index) => {
    const image = images[index];
    const user = await apiClient.auth.me();
    
    // Only allow users to favorite their own images
    if (image.user_email !== user.email) {
      toast({
        title: "Cannot Favorite",
        description: "You can only favorite your own images",
        variant: "destructive"
      });
      return;
    }

    const updatedUserImages = [...(user.generated_images || [])];
    const userImageIndex = updatedUserImages.findIndex(img => 
      img.image_url === image.image_url && img.created_date === image.created_date
    );
    
    if (userImageIndex !== -1) {
      updatedUserImages[userImageIndex].is_favorite = !updatedUserImages[userImageIndex].is_favorite;
      
      try {
        await apiClient.auth.updateMe({
          generated_images: updatedUserImages
        });
        
        // Reload to reflect changes
        loadImages();
        
        toast({
          title: updatedUserImages[userImageIndex].is_favorite ? "Added to Favorites" : "Removed from Favorites",
          description: "Image updated"
        });
      } catch (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const copyImageUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Image URL copied to clipboard"
    });
  };

  const downloadImage = (url, prompt) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.png`;
    a.click();
  };

  const bulkDownloadImages = async () => {
    if (filteredImages.length === 0) {
      toast({
        title: "No Images",
        description: "No images available to download",
        variant: "destructive"
      });
      return;
    }

    setDownloading(true);
    
    try {
      // Dynamically import JSZip
      const JSZip = (await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
      const zip = new JSZip();
      
      // Fetch and add each image to the ZIP
      for (let i = 0; i < filteredImages.length; i++) {
        const img = filteredImages[i];
        try {
          const response = await fetch(img.image_url);
          const blob = await response.blob();
          const filename = `${i + 1}-${img.prompt.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}.png`;
          zip.file(filename, blob);
        } catch (error) {
          console.error(`Failed to fetch image ${i + 1}:`, error);
        }
      }
      
      // Generate ZIP and trigger download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(zipBlob);
      a.download = `ai-generated-images-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
      
      toast({
        title: "Download Complete",
        description: `Downloaded ${filteredImages.length} images as ZIP`
      });
    } catch (error) {
      console.error('Bulk download failed:', error);
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };

  const getCurrentImageIndex = () => {
    return filteredImages.findIndex(
      img => img.image_url === selectedImage?.image_url && img.created_date === selectedImage?.created_date
    );
  };

  const goToPreviousImage = () => {
    const currentIndex = getCurrentImageIndex();
    if (currentIndex > 0) {
      setSelectedImage(filteredImages[currentIndex - 1]);
      setShowFullPrompt(false);
    }
  };

  const goToNextImage = () => {
    const currentIndex = getCurrentImageIndex();
    if (currentIndex < filteredImages.length - 1) {
      setSelectedImage(filteredImages[currentIndex + 1]);
      setShowFullPrompt(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              AI Generated Images
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600">{images.length} total</Badge>
              {currentUser?.role === 'admin' && filteredImages.length > 0 && (
                <Button
                  onClick={bulkDownloadImages}
                  disabled={downloading}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Archive className="w-4 h-4 mr-2" />
                      Download All ({filteredImages.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by prompt, style, persona, project, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredImages.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">
                {searchQuery ? 'No images found' : 'No images generated yet'}
              </p>
              <p className="text-sm">
                {searchQuery ? 'Try a different search term' : 'Start creating images with the AI Image Generator'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {filteredImages.slice(0, displayLimit).map((img, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="group relative"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                        <div
                          onClick={() => setSelectedImage(img)}
                          className="relative aspect-square bg-gray-100"
                        >
                          <img
                            src={img.image_url}
                            alt={img.prompt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(idx);
                              }}
                            >
                              {img.is_favorite ? (
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ) : (
                                <StarOff className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                            {img.prompt}
                          </p>
                          {img.user_name && (
                            <p className="text-xs text-gray-500 mb-2">
                              By {img.user_name}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              {img.style && (
                                <Badge variant="outline" className="text-xs">
                                  {img.style}
                                </Badge>
                              )}
                              {img.persona_name && (
                                <Badge variant="outline" className="text-xs bg-indigo-50">
                                  {img.persona_name}
                                </Badge>
                              )}
                              {img.project_name && (
                                <Badge variant="outline" className="text-xs bg-blue-50">
                                  {img.project_name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyImageUrl(img.image_url);
                                }}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadImage(img.image_url, img.prompt);
                                }}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          {img.created_date && (
                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(img.created_date).toLocaleDateString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Load More Button */}
              {filteredImages.length > displayLimit && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                    variant="outline"
                    size="lg"
                    className="bg-white hover:bg-purple-50"
                  >
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load More ({filteredImages.length - displayLimit} remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Detail Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => { setSelectedImage(null); setShowFullPrompt(false); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Image Details
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              {/* Large Image - Main Focus with Navigation */}
              <div className="relative rounded-lg overflow-hidden border-2 border-purple-200 shadow-2xl group">
                <img
                  src={selectedImage.image_url}
                  alt={selectedImage.prompt}
                  className="w-full h-auto max-h-[60vh] object-contain bg-gray-100"
                />

                {/* Navigation Arrows */}
                {getCurrentImageIndex() > 0 && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={goToPreviousImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                )}

                {getCurrentImageIndex() < filteredImages.length - 1 && (
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={goToNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                )}
              </div>

              {/* Action Buttons - Prominent */}
              <div className="flex gap-3">
                <Button
                  onClick={() => copyImageUrl(selectedImage.image_url)}
                  className="flex-1"
                  variant="outline"
                  size="lg"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy URL
                </Button>
                <Button
                  onClick={() => downloadImage(selectedImage.image_url, selectedImage.prompt)}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
              
              {/* Compact Metadata */}
              <div className="flex flex-wrap gap-2">
                {selectedImage.style && (
                  <Badge variant="outline" className="text-xs">
                    {selectedImage.style}
                  </Badge>
                )}
                {selectedImage.persona_name && (
                  <Badge variant="outline" className="text-xs bg-indigo-50">
                    {selectedImage.persona_name}
                  </Badge>
                )}
                {selectedImage.project_name && (
                  <Badge variant="outline" className="text-xs bg-blue-50">
                    {selectedImage.project_name}
                  </Badge>
                )}
                {selectedImage.created_date && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(selectedImage.created_date).toLocaleDateString()}
                  </Badge>
                )}
              </div>

              {/* Collapsible Prompt */}
              {selectedImage.prompt && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setShowFullPrompt(!showFullPrompt)}
                    className="w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide cursor-pointer">
                      Prompt Details
                    </Label>
                    {showFullPrompt ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {showFullPrompt && (
                    <div className="p-4 bg-white">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                        {selectedImage.prompt}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
