import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Users, Download, Upload, GitBranch, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function PersonaFamilyManager({ personas, onCreateSubPersona, onExport, onImport }) {
  const [showCreateFamily, setShowCreateFamily] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [subPersonaData, setSubPersonaData] = useState({
    name: '',
    specialization: '',
    unique_traits: [],
    description: ''
  });
  const [traitInput, setTraitInput] = useState('');
  const { toast } = useToast();

  // Get base personas (no parent)
  const basePersonas = personas.filter(p => !p.parent_persona_id);
  
  // Group personas by family
  const personaFamilies = React.useMemo(() => {
    const families = {};
    
    basePersonas.forEach(base => {
      const children = personas.filter(p => p.parent_persona_id === base.id);
      if (children.length > 0 || base.family_name) {
        families[base.id] = {
          base,
          children
        };
      }
    });
    
    return families;
  }, [personas, basePersonas]);

  const handleExportPersonas = () => {
    const customPersonas = personas.filter(p => p.is_custom);
    const dataStr = JSON.stringify(customPersonas, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `custom-personas-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exported Successfully",
      description: `${customPersonas.length} custom personas exported.`,
    });
  };

  const handleImportPersonas = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result);
        
        if (onImport) {
          await onImport(importedData);
        }
        
        toast({
          title: "Imported Successfully",
          description: `${importedData.length} personas imported.`,
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Please check the file format and try again.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCreateSubPersona = () => {
    if (!selectedParent || !subPersonaData.name || !subPersonaData.specialization) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newPersona = {
      name: subPersonaData.name,
      description: subPersonaData.description || `Specialized ${selectedParent.name} focusing on ${subPersonaData.specialization}`,
      icon: selectedParent.icon,
      color: selectedParent.color,
      category: selectedParent.category,
      tone: selectedParent.tone,
      instructions: selectedParent.instructions,
      expertise_areas: [...selectedParent.expertise_areas],
      parent_persona_id: selectedParent.id,
      family_name: selectedParent.family_name || selectedParent.name,
      specialization: subPersonaData.specialization,
      inherited_traits: [
        `Tone: ${selectedParent.tone}`,
        `Category: ${selectedParent.category}`,
        ...selectedParent.expertise_areas.slice(0, 3)
      ],
      unique_traits: subPersonaData.unique_traits,
      is_custom: true,
      tags: [...(selectedParent.tags || []), subPersonaData.specialization.toLowerCase()]
    };

    if (onCreateSubPersona) {
      onCreateSubPersona(newPersona);
    }

    setShowCreateFamily(false);
    setSelectedParent(null);
    setSubPersonaData({ name: '', specialization: '', unique_traits: [], description: '' });
  };

  const addTrait = () => {
    if (traitInput.trim() && !subPersonaData.unique_traits.includes(traitInput.trim())) {
      setSubPersonaData(prev => ({
        ...prev,
        unique_traits: [...prev.unique_traits, traitInput.trim()]
      }));
      setTraitInput('');
    }
  };

  const removeTrait = (trait) => {
    setSubPersonaData(prev => ({
      ...prev,
      unique_traits: prev.unique_traits.filter(t => t !== trait)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Export/Import Card */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Persona Management
          </CardTitle>
          <CardDescription>
            Export, import, and manage your custom personas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <Button onClick={handleExportPersonas} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export Custom Personas
            </Button>
            
            <input
              type="file"
              accept=".json"
              onChange={handleImportPersonas}
              className="hidden"
              id="import-personas"
            />
            <label htmlFor="import-personas" className="flex-1">
              <Button asChild variant="outline" className="w-full">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Personas
                </span>
              </Button>
            </label>
          </div>

          <Button
            onClick={() => setShowCreateFamily(true)}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Create Sub-Persona
          </Button>
        </CardContent>
      </Card>

      {/* Persona Families */}
      {Object.keys(personaFamilies).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Persona Families ({Object.keys(personaFamilies).length})
            </CardTitle>
            <CardDescription>
              View hierarchical relationships between personas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.values(personaFamilies).map(({ base, children }) => (
              <Card key={base.id} className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    {/* Base Persona */}
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-purple-300">
                      <span className="text-2xl">{base.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold">{base.name}</p>
                        <p className="text-xs text-gray-600">Base Persona</p>
                      </div>
                      <Badge className="bg-purple-600">
                        {children.length} variants
                      </Badge>
                    </div>

                    {/* Sub-Personas */}
                    {children.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {children.map(child => (
                          <div key={child.id} className="flex items-center gap-3 p-2 bg-white rounded-lg border border-indigo-200">
                            <GitBranch className="w-4 h-4 text-indigo-600" />
                            <span className="text-xl">{child.icon}</span>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{child.name}</p>
                              <p className="text-xs text-gray-600">{child.specialization}</p>
                            </div>
                            {child.unique_traits.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {child.unique_traits.length} unique traits
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Sub-Persona Dialog */}
      <Dialog open={showCreateFamily} onOpenChange={setShowCreateFamily}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-600" />
              Create Sub-Persona
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Sub-personas inherit traits from a base persona but have unique specializations and characteristics.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Select Parent Persona *</Label>
              <Select value={selectedParent?.id} onValueChange={(id) => setSelectedParent(basePersonas.find(p => p.id === id))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose base persona..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {basePersonas.map(persona => (
                    <SelectItem key={persona.id} value={persona.id}>
                      <div className="flex items-center gap-2">
                        <span>{persona.icon}</span>
                        <span>{persona.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedParent && (
              <>
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader>
                    <CardTitle className="text-sm">Inherited Traits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>Category:</strong> {selectedParent.category}</p>
                      <p><strong>Tone:</strong> {selectedParent.tone}</p>
                      <p><strong>Expertise:</strong> {selectedParent.expertise_areas.slice(0, 3).join(', ')}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <Label>Sub-Persona Name *</Label>
                  <Input
                    placeholder="e.g., Senior Frontend Developer, Brand Copywriter"
                    value={subPersonaData.name}
                    onChange={(e) => setSubPersonaData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Specialization *</Label>
                  <Input
                    placeholder="e.g., React & TypeScript, Fashion Copywriting"
                    value={subPersonaData.specialization}
                    onChange={(e) => setSubPersonaData(prev => ({ ...prev, specialization: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Custom Description (optional)</Label>
                  <Textarea
                    placeholder="Override with custom description or leave empty to auto-generate"
                    value={subPersonaData.description}
                    onChange={(e) => setSubPersonaData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unique Traits (what makes this variant special)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add unique trait"
                      value={traitInput}
                      onChange={(e) => setTraitInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrait())}
                    />
                    <Button type="button" onClick={addTrait} variant="outline" size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {subPersonaData.unique_traits.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {subPersonaData.unique_traits.map((trait, idx) => (
                        <Badge key={idx} variant="secondary" className="pl-2.5 pr-1 py-1">
                          {trait}
                          <button
                            type="button"
                            onClick={() => removeTrait(trait)}
                            className="ml-1.5 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateFamily(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubPersona}
              disabled={!selectedParent || !subPersonaData.name || !subPersonaData.specialization}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              Create Sub-Persona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}