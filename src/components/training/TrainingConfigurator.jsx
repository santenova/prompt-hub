import React, { useState } from "react";
import { apiClient } from "@/apis/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Zap,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Settings as SettingsIcon
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function TrainingConfigurator({ subscription, packageInfo, userEmail, datasets }) {
  const [trainingName, setTrainingName] = useState("");
  const [description, setDescription] = useState("");
  const [trainingType, setTrainingType] = useState("fine-tune");
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [config, setConfig] = useState({
    learning_rate: 0.001,
    epochs: 3,
    batch_size: 8,
    temperature: 0.7,
    max_tokens: 2048,
    custom_instructions: "",
    system_prompt: "",
    example_prompts: []
  });
  const [examplePrompt, setExamplePrompt] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const startTrainingMutation = useMutation({
    mutationFn: (data) => apiClient.entities.AgentTraining.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent-trainings']);
      resetForm();
      toast({
        title: "Training Started!",
        description: "Your agent training job has been queued and will begin shortly.",
      });
    },
  });

  const handleDatasetToggle = (datasetId) => {
    setSelectedDatasets(prev => 
      prev.includes(datasetId)
        ? prev.filter(id => id !== datasetId)
        : [...prev, datasetId]
    );
  };

  const addExamplePrompt = () => {
    if (examplePrompt.trim()) {
      setConfig(prev => ({
        ...prev,
        example_prompts: [...prev.example_prompts, examplePrompt.trim()]
      }));
      setExamplePrompt("");
    }
  };

  const removeExamplePrompt = (index) => {
    setConfig(prev => ({
      ...prev,
      example_prompts: prev.example_prompts.filter((_, i) => i !== index)
    }));
  };

  const handleStartTraining = async () => {
    if (!trainingName) {
      toast({
        title: "Missing Information",
        description: "Please provide a name for this training job.",
        variant: "destructive"
      });
      return;
    }

    if (trainingType === 'fine-tune' && selectedDatasets.length === 0) {
      toast({
        title: "No Dataset Selected",
        description: "Please select at least one dataset for fine-tuning.",
        variant: "destructive"
      });
      return;
    }

    try {
      await startTrainingMutation.mutateAsync({
        user_email: userEmail,
        subscription_id: subscription.id,
        package_id: packageInfo.id,
        training_name: trainingName,
        description: description,
        dataset_ids: selectedDatasets,
        training_type: trainingType,
        base_model: packageInfo.name,
        training_config: config,
        status: 'pending',
        progress: 0,
        cost_estimate: calculateCostEstimate()
      });
    } catch (error) {
      console.error('Training start failed:', error);
      toast({
        title: "Training Failed to Start",
        description: "There was an error starting your training job. Please try again.",
        variant: "destructive"
      });
    }
  };

  const calculateCostEstimate = () => {
    // Simple cost estimation based on training type and dataset size
    const baseCost = {
      'fine-tune': 50,
      'prompt-engineering': 5,
      'custom-config': 1,
      'few-shot': 10
    };
    
    const datasetMultiplier = selectedDatasets.length || 1;
    const epochMultiplier = config.epochs || 1;
    
    return baseCost[trainingType] * datasetMultiplier * (epochMultiplier / 3);
  };

  const resetForm = () => {
    setTrainingName("");
    setDescription("");
    setSelectedDatasets([]);
    setExamplePrompt("");
  };

  const trainingTypes = [
    { value: 'fine-tune', label: 'Fine-Tuning', desc: 'Deep training on your custom dataset' },
    { value: 'prompt-engineering', label: 'Prompt Engineering', desc: 'Optimize prompts for better results' },
    { value: 'custom-config', label: 'Custom Configuration', desc: 'Adjust parameters without retraining' },
    { value: 'few-shot', label: 'Few-Shot Learning', desc: 'Train with limited examples' }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Configure Training Job
          </CardTitle>
          <CardDescription>
            Set up a custom training job for {packageInfo.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="training-name">Training Name *</Label>
              <Input
                id="training-name"
                placeholder="e.g., Customer Support v2"
                value={trainingName}
                onChange={(e) => setTrainingName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you're trying to achieve with this training..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Training Type</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {trainingTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      trainingType === type.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setTrainingType(type.value)}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={trainingType === type.value}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-semibold text-sm">{type.label}</p>
                        <p className="text-xs text-gray-600">{type.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Dataset Selection */}
          {(trainingType === 'fine-tune' || trainingType === 'few-shot') && (
            <div className="space-y-3">
              <Label>Select Training Datasets</Label>
              {datasets.length === 0 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-900">
                    No datasets available. Please upload a dataset first.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {datasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedDatasets.includes(dataset.id)}
                        onCheckedChange={() => handleDatasetToggle(dataset.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{dataset.dataset_name}</p>
                        <p className="text-xs text-gray-600">
                          {dataset.row_count?.toLocaleString()} rows • {dataset.file_type?.toUpperCase()}
                        </p>
                      </div>
                      <Badge variant="outline">{dataset.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Training Configuration */}
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-gray-600" />
              <h4 className="font-semibold">Training Parameters</h4>
            </div>

            {trainingType === 'fine-tune' && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Learning Rate</Label>
                    <span className="text-sm font-mono text-gray-600">{config.learning_rate}</span>
                  </div>
                  <Slider
                    value={[config.learning_rate * 1000]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, learning_rate: value / 1000 }))}
                    min={0.1}
                    max={10}
                    step={0.1}
                  />
                  <p className="text-xs text-gray-500">Lower values = more conservative learning</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Training Epochs</Label>
                    <span className="text-sm font-mono text-gray-600">{config.epochs}</span>
                  </div>
                  <Slider
                    value={[config.epochs]}
                    onValueChange={([value]) => setConfig(prev => ({ ...prev, epochs: value }))}
                    min={1}
                    max={10}
                    step={1}
                  />
                  <p className="text-xs text-gray-500">More epochs = longer training, potentially better results</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Batch Size</Label>
                    <span className="text-sm font-mono text-gray-600">{config.batch_size}</span>
                  </div>
                  <Select
                    value={config.batch_size.toString()}
                    onValueChange={(value) => setConfig(prev => ({ ...prev, batch_size: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                      <SelectItem value="16">16</SelectItem>
                      <SelectItem value="32">32</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperature</Label>
                <span className="text-sm font-mono text-gray-600">{config.temperature}</span>
              </div>
              <Slider
                value={[config.temperature * 100]}
                onValueChange={([value]) => setConfig(prev => ({ ...prev, temperature: value / 100 }))}
                min={0}
                max={200}
                step={1}
              />
              <p className="text-xs text-gray-500">Higher = more creative, Lower = more deterministic</p>
            </div>

            <div className="space-y-2">
              <Label>System Prompt (Optional)</Label>
              <Textarea
                placeholder="Enter a custom system prompt to guide the agent's behavior..."
                value={config.system_prompt}
                onChange={(e) => setConfig(prev => ({ ...prev, system_prompt: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Custom Instructions</Label>
              <Textarea
                placeholder="Add any specific instructions or guidelines for the agent..."
                value={config.custom_instructions}
                onChange={(e) => setConfig(prev => ({ ...prev, custom_instructions: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Example Prompts</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add an example prompt..."
                  value={examplePrompt}
                  onChange={(e) => setExamplePrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addExamplePrompt()}
                />
                <Button onClick={addExamplePrompt} variant="outline">
                  Add
                </Button>
              </div>
              {config.example_prompts.length > 0 && (
                <div className="space-y-2 mt-2">
                  {config.example_prompts.map((prompt, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                      <span className="text-sm flex-1">{prompt}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeExamplePrompt(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cost Estimate */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Estimated Cost</p>
                <p className="text-2xl font-bold text-blue-600">${calculateCostEstimate().toFixed(2)}</p>
                <p className="text-xs mt-1">
                  Based on {trainingType}, {selectedDatasets.length} dataset(s), and {config.epochs} epochs
                </p>
              </div>
            </div>
          </div>

          {/* Start Training Button */}
          <Button
            onClick={handleStartTraining}
            disabled={!trainingName || startTrainingMutation.isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
            size="lg"
          >
            {startTrainingMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting Training...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 mr-2" />
                Start Training
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
