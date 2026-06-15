import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, RefreshCw, Play, CheckCircle, AlertCircle, Loader2, X, Send } from "lucide-react";
import { getOllamaEndpoint } from '@/lib/ollamaEndpoint';

export default function PersonaTestQuestions({ formData, onQuestionsGenerated }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [testResults, setTestResults] = useState({}); // { questionIdx: response }
  const [activeTestIdx, setActiveTestIdx] = useState(null);

  const questions = formData.test_questions || [];
  const expertiseAreas = formData.expertise_areas || [];

  // Load available models on mount
  React.useEffect(() => {
    if (!modelsLoaded) loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const endpoint = getOllamaEndpoint();
      const res = await fetch(`${endpoint}/v1/models`);
      if (res.ok) {
        const data = await res.json();
        const models = (data.data || []).map(m => m.id);
        setAvailableModels(models);
        if (models.length > 0) setSelectedModel(models[0]);
      }
    } catch (e) {
      // Ollama offline
    }
    setModelsLoaded(true);
  };

  const generateQuestions = async () => {
    if (expertiseAreas.length === 0) return;
    setIsGenerating(true);
    setTestResults({});

    try {
      const endpoint = getOllamaEndpoint();
      const model = selectedModel || 'llama3.2';
      const res = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: 'user',
              content: `You are creating test questions to evaluate an AI persona.\n\nPersona Name: ${formData.name}\nPersona Description: ${formData.description}\nExpertise Areas: ${expertiseAreas.join(', ')}\n\nGenerate exactly 5 specific test questions that ONLY cover these expertise areas: ${expertiseAreas.join(', ')}.\nEach question should test deep knowledge in one of the listed expertise areas.\nDo NOT generate questions outside these areas.\n\nReturn ONLY a JSON array of 5 strings, no explanation:\n["question1", "question2", "question3", "question4", "question5"]`
            }
          ]
        })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) {
          onQuestionsGenerated(parsed.slice(0, 5));
        }
      }
    } catch (e) {
      // error
    }
    setIsGenerating(false);
  };

  const testQuestion = async (question, idx) => {
    if (!selectedModel || isTesting) return;
    setActiveTestIdx(idx);
    setIsTesting(true);

    const systemContent = formData.instructions
      ? `${formData.instructions}\n\nYou are ${formData.name}. ${formData.description}`
      : `You are ${formData.name}. ${formData.description}`;

    try {
      const endpoint = getOllamaEndpoint();
      const res = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          stream: false,
          messages: [
            { role: 'system', content: systemContent },
            { role: 'user', content: question }
          ]
        })
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setTestResults(prev => ({ ...prev, [idx]: data.choices?.[0]?.message?.content || 'No response' }));
    } catch (e) {
      setTestResults(prev => ({ ...prev, [idx]: 'Error: Could not reach server' }));
    }
    setIsTesting(false);
    setActiveTestIdx(null);
  };

  const sendAll = async () => {
    if (!selectedModel || isTesting || questions.length === 0) return;
    const systemContent = formData.instructions
      ? `${formData.instructions}\n\nYou are ${formData.name}. ${formData.description}`
      : `You are ${formData.name}. ${formData.description}`;
    const endpoint = getOllamaEndpoint();
    for (let idx = 0; idx < questions.length; idx++) {
      setActiveTestIdx(idx);
      setIsTesting(true);
      try {
        const res = await fetch(`${endpoint}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            stream: false,
            messages: [
              { role: 'system', content: systemContent },
              { role: 'user', content: questions[idx] }
            ]
          })
        });
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setTestResults(prev => ({ ...prev, [idx]: data.choices?.[0]?.message?.content || 'No response' }));
      } catch (e) {
        setTestResults(prev => ({ ...prev, [idx]: 'Error: Could not reach server' }));
      }
    }
    setIsTesting(false);
    setActiveTestIdx(null);
  };

  const removeQuestion = (idx) => {
    const updated = questions.filter((_, i) => i !== idx);
    onQuestionsGenerated(updated);
    setTestResults(prev => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">Test Questions</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-generated from expertise areas only
          </p>
        </div>
        {availableModels.length > 0 && (
          <select
            className="text-xs border rounded px-2 py-1 bg-white"
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
          >
            {availableModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        )}
      </div>

      {/* Expertise areas preview */}
      {expertiseAreas.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {expertiseAreas.map((area, i) => (
            <Badge key={i} variant="outline" className="text-xs bg-indigo-50 border-indigo-200 text-indigo-700">
              {area}
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
          Add expertise areas first to generate test questions.
        </div>
      )}

      {/* Generate button */}
      <Button
        type="button"
        onClick={generateQuestions}
        disabled={isGenerating || expertiseAreas.length === 0}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        size="sm"
      >
        {isGenerating ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
        ) : (
          <><Sparkles className="w-4 h-4 mr-2" />{questions.length > 0 ? 'Regenerate Questions' : 'Generate Test Questions'}</>
        )}
      </Button>

      {!modelsLoaded && (
        <p className="text-xs text-gray-400 text-center">Connecting to Ollama...</p>
      )}
      {modelsLoaded && availableModels.length === 0 && (
        <p className="text-xs text-red-500 text-center">Ollama offline — cannot generate or test</p>
      )}

      {/* Send All button */}
      {questions.length > 0 && (
        <Button
          type="button"
          onClick={sendAll}
          disabled={isTesting || !selectedModel}
          variant="outline"
          size="sm"
          className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-50"
        >
          {isTesting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Testing all...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" />Send All Questions</>
          )}
        </Button>
      )}

      {/* Questions list with test buttons */}
      {questions.length > 0 && (
        <div className="space-y-3">
          {questions.map((q, idx) => (
            <div key={idx} className="border rounded-lg p-3 bg-white space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-indigo-600 mt-0.5 shrink-0">Q{idx + 1}</span>
                <p className="text-sm text-gray-800 flex-1">{q}</p>
                <div className="flex gap-1 shrink-0">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    disabled={isTesting || availableModels.length === 0}
                    onClick={() => testQuestion(q, idx)}
                  >
                    {activeTestIdx === idx ? (
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                    ) : (
                      <Play className="w-3 h-3 text-indigo-600" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => removeQuestion(idx)}
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </Button>
                </div>
              </div>

              {testResults[idx] && (
                <div className="bg-gray-50 rounded p-2 border-l-2 border-indigo-300">
                  <div className="flex items-center gap-1 mb-1">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-medium text-gray-600">Persona Response:</span>
                  </div>
                  <p className="text-xs text-gray-700 whitespace-pre-wrap">{testResults[idx]}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}