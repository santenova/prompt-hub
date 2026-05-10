import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, Plus, Trash2, Settings, GitBranch, 
  Code, Zap, CornerDownRight, Grid3x3
} from "lucide-react";
import { motion } from "framer-motion";
import StepConfigurator from "./StepConfigurator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;

export default function VisualWorkflowBuilder({ steps, onStepsChange, connections, onConnectionsChange }) {
  const [selectedStep, setSelectedStep] = useState(null);
  const [draggingStep, setDraggingStep] = useState(null);
  const [connectingFrom, setConnectingFrom] = useState(null);
  const canvasRef = useRef(null);

  const addStep = (type = 'ai_prompt') => {
    const newStep = {
      id: Math.max(...steps.map(s => s.id || 0), 0) + 1,
      type,
      template_id: '',
      persona_id: '',
      custom_prompt: '',
      output_variable: `step_${Date.now()}`,
      model_params: { temperature: 0.7, top_p: 1, max_tokens: 500 },
      position: { x: 100 + steps.length * 50, y: 100 + steps.length * 30 }
    };
    onStepsChange([...steps, newStep]);
  };

  const updateStepPosition = (id, x, y) => {
    onStepsChange(steps.map(s => 
      s.id === id ? { ...s, position: { x, y } } : s
    ));
  };

  const deleteStep = (id) => {
    onStepsChange(steps.filter(s => s.id !== id));
    onConnectionsChange(connections.filter(c => c.from_step !== id && c.to_step !== id));
    if (selectedStep?.id === id) setSelectedStep(null);
  };

  const handleStepClick = (step, e) => {
    e.stopPropagation();
    if (connectingFrom) {
      if (connectingFrom !== step.id) {
        const newConnection = {
          from_step: connectingFrom,
          to_step: step.id,
          condition: 'default'
        };
        if (!connections.find(c => c.from_step === connectingFrom && c.to_step === step.id)) {
          onConnectionsChange([...connections, newConnection]);
        }
      }
      setConnectingFrom(null);
    } else {
      setSelectedStep(step);
    }
  };

  const handleDragStart = (step, e) => {
    setDraggingStep(step.id);
  };

  const handleDrag = useCallback((e) => {
    if (draggingStep && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - NODE_WIDTH / 2;
      const y = e.clientY - rect.top - NODE_HEIGHT / 2;
      updateStepPosition(draggingStep, Math.max(0, x), Math.max(0, y));
    }
  }, [draggingStep]);

  const handleDragEnd = () => {
    setDraggingStep(null);
  };

  const getStepIcon = (type) => {
    switch(type) {
      case 'ai_prompt': return <Sparkles className="w-4 h-4" />;
      case 'api_call': return <Code className="w-4 h-4" />;
      case 'condition': return <GitBranch className="w-4 h-4" />;
      case 'component': return <Grid3x3 className="w-4 h-4" />;
      default: return <Zap className="w-4 h-4" />;
    }
  };

  const getStepColor = (type) => {
    switch(type) {
      case 'ai_prompt': return 'from-purple-500 to-indigo-500';
      case 'api_call': return 'from-green-500 to-emerald-500';
      case 'condition': return 'from-orange-500 to-amber-500';
      case 'component': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-700 mr-2">Add Step:</p>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addStep('ai_prompt')}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              AI Prompt
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addStep('api_call')}
            >
              <Code className="w-3 h-3 mr-1" />
              API Call
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addStep('condition')}
            >
              <GitBranch className="w-3 h-3 mr-1" />
              Condition
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => addStep('component')}
            >
              <Grid3x3 className="w-3 h-3 mr-1" />
              Component
            </Button>
            <div className="ml-auto text-xs text-gray-600">
              {connectingFrom ? '🔗 Click another step to connect' : 'Drag to move • Click to edit'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardContent className="p-0">
          <div
            ref={canvasRef}
            className="relative w-full h-[600px] overflow-auto bg-grid-white/[0.2] bg-[size:20px_20px]"
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onClick={() => setConnectingFrom(null)}
          >
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {connections.map((conn, idx) => {
                const fromStep = steps.find(s => s.id === conn.from_step);
                const toStep = steps.find(s => s.id === conn.to_step);
                if (!fromStep || !toStep) return null;

                const x1 = (fromStep.position?.x || 0) + NODE_WIDTH / 2;
                const y1 = (fromStep.position?.y || 0) + NODE_HEIGHT;
                const x2 = (toStep.position?.x || 0) + NODE_WIDTH / 2;
                const y2 = (toStep.position?.y || 0);

                return (
                  <g key={idx}>
                    <path
                      d={`M ${x1} ${y1} C ${x1} ${y1 + 50}, ${x2} ${y2 - 50}, ${x2} ${y2}`}
                      stroke="#9333ea"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#9333ea" />
                </marker>
              </defs>
            </svg>

            {/* Steps */}
            {steps.map((step) => (
              <motion.div
                key={step.id}
                className="absolute cursor-move"
                style={{
                  left: step.position?.x || 0,
                  top: step.position?.y || 0,
                  width: NODE_WIDTH,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onMouseDown={(e) => handleDragStart(step, e)}
                onClick={(e) => handleStepClick(step, e)}
              >
                <Card className={`border-2 ${
                  selectedStep?.id === step.id ? 'border-purple-500 shadow-lg' : 'border-gray-200'
                } bg-white`}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className={`p-1.5 rounded-lg bg-gradient-to-r ${getStepColor(step.type)}`}>
                          {getStepIcon(step.type)}
                          <span className="text-white text-xs ml-1">
                            {step.type === 'ai_prompt' && 'AI'}
                            {step.type === 'api_call' && 'API'}
                            {step.type === 'condition' && 'IF'}
                            {step.type === 'component' && 'COMP'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConnectingFrom(step.id);
                            }}
                          >
                            <CornerDownRight className="w-3 h-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-red-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteStep(step.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-h-[40px]">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {step.type === 'ai_prompt' && (step.template_id ? 'Template' : 'Custom Prompt')}
                          {step.type === 'api_call' && (step.api_config?.url || 'Configure API')}
                          {step.type === 'condition' && 'Conditional Branch'}
                          {step.type === 'component' && 'Component'}
                        </p>
                        <Badge variant="outline" className="text-[10px] mt-1">
                          → {step.output_variable || 'output'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Empty state */}
            {steps.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium mb-2">No steps yet</p>
                  <p className="text-sm text-gray-500">Add a step from the toolbar above</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Configuration Dialog */}
      <Dialog open={!!selectedStep} onOpenChange={() => setSelectedStep(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStep && getStepIcon(selectedStep.type)}
              Configure Step
            </DialogTitle>
          </DialogHeader>
          {selectedStep && (
            <StepConfigurator
              step={selectedStep}
              onUpdate={(updates) => {
                onStepsChange(steps.map(s => 
                  s.id === selectedStep.id ? { ...s, ...updates } : s
                ));
                setSelectedStep({ ...selectedStep, ...updates });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}