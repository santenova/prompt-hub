import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, CreditCard, Check } from 'lucide-react';
import { apiClient } from '@/apis/client';
import { useToast } from '@/components/ui/use-toast';

export default function StripeProductImporter({ open, onClose, onImport }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectName, setProjectName] = useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    if (open) {
      fetchStripeProducts();
    }
  }, [open]);

  const fetchStripeProducts = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.functions.invoke('getStripeProductsList');
      setProducts(response.data?.products || []);
    } catch (error) {
      toast({
        title: 'Failed to load Stripe products',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setProjectName(product.name || '');
  };

  const handleCreate = () => {
    if (!projectName.trim() || !selectedProduct) {
      toast({
        title: 'Missing information',
        description: 'Please select a product and enter a project name',
        variant: 'destructive'
      });
      return;
    }

    const projectData = {
      name: projectName,
      description: selectedProduct.description || '',
      topic: selectedProduct.name,
      is_active: true
    };

    onImport(projectData);
    setSelectedProduct(null);
    setProjectName('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" />
            Create Project from Stripe Product
          </DialogTitle>
          <DialogDescription>
            Select a Stripe product to auto-populate project details
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : products.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600">No Stripe products found</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {products.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        {selectedProduct?.id === product.id && (
                          <Check className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      {product.description && (
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                      )}
                      {product.metadata && Object.keys(product.metadata).length > 0 && (
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {Object.entries(product.metadata).map(([key, value]) => (
                            <Badge key={key} variant="outline" className="text-xs">
                              {key}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 ml-2">
                      {product.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedProduct && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <Label className="text-sm font-semibold">Project Name</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name..."
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedProduct || !projectName.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
