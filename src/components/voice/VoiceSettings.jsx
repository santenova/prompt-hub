import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Mic, Volume2, Zap, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VoiceSettings({ onSettingsChange }) {
  const [noiseReduction, setNoiseReduction] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_noise_reduction') || 'false');
    } catch { return false; }
  });
  
  const [micGain, setMicGain] = useState(() => {
    try {
      return parseFloat(localStorage.getItem('voice_mic_gain') || '1.0');
    } catch { return 1.0; }
  });
  
  const [wakeWordEnabled, setWakeWordEnabled] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_wake_word_enabled') || 'false');
    } catch { return false; }
  });
  
  const [wakeWord, setWakeWord] = useState(() => {
    return localStorage.getItem('voice_wake_word') || 'hey assistant';
  });
  
  const [echoCancellation, setEchoCancellation] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_echo_cancellation') || 'true');
    } catch { return true; }
  });
  
  const [autoGainControl, setAutoGainControl] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_auto_gain') || 'true');
    } catch { return true; }
  });
  
  const { toast } = useToast();

  useEffect(() => {
    localStorage.setItem('voice_noise_reduction', JSON.stringify(noiseReduction));
    if (onSettingsChange) onSettingsChange({ noiseReduction });
  }, [noiseReduction]);

  useEffect(() => {
    localStorage.setItem('voice_mic_gain', micGain.toString());
    if (onSettingsChange) onSettingsChange({ micGain });
  }, [micGain]);

  useEffect(() => {
    localStorage.setItem('voice_wake_word_enabled', JSON.stringify(wakeWordEnabled));
    if (onSettingsChange) onSettingsChange({ wakeWordEnabled });
  }, [wakeWordEnabled]);

  useEffect(() => {
    localStorage.setItem('voice_wake_word', wakeWord);
    if (onSettingsChange) onSettingsChange({ wakeWord });
  }, [wakeWord]);

  useEffect(() => {
    localStorage.setItem('voice_echo_cancellation', JSON.stringify(echoCancellation));
    if (onSettingsChange) onSettingsChange({ echoCancellation });
  }, [echoCancellation]);

  useEffect(() => {
    localStorage.setItem('voice_auto_gain', JSON.stringify(autoGainControl));
    if (onSettingsChange) onSettingsChange({ autoGainControl });
  }, [autoGainControl]);

  const handleSaveWakeWord = () => {
    toast({
      title: "Wake Word Updated",
      description: `Now listening for "${wakeWord}"`
    });
  };

  const getGainLabel = () => {
    if (micGain < 0.5) return 'Very Low';
    if (micGain < 0.8) return 'Low';
    if (micGain < 1.2) return 'Normal';
    if (micGain < 1.5) return 'High';
    return 'Very High';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-600" />
          Voice Input Settings
        </CardTitle>
        <CardDescription>
          Configure audio processing and microphone settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Processing */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Volume2 className="w-4 h-4" />
            Audio Processing
          </h3>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="font-medium">Noise Reduction</Label>
              <p className="text-xs text-gray-500 mt-1">
                Reduce background noise for clearer audio
              </p>
            </div>
            <Switch
              checked={noiseReduction}
              onCheckedChange={setNoiseReduction}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="font-medium">Echo Cancellation</Label>
              <p className="text-xs text-gray-500 mt-1">
                Prevent feedback from speakers
              </p>
            </div>
            <Switch
              checked={echoCancellation}
              onCheckedChange={setEchoCancellation}
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="font-medium">Auto Gain Control</Label>
              <p className="text-xs text-gray-500 mt-1">
                Automatically adjust microphone sensitivity
              </p>
            </div>
            <Switch
              checked={autoGainControl}
              onCheckedChange={setAutoGainControl}
            />
          </div>
        </div>

        {/* Microphone Gain */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Microphone Gain
          </h3>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Gain Level: {getGainLabel()}</Label>
              <Badge variant="outline">{micGain.toFixed(1)}x</Badge>
            </div>
            <Slider
              value={[micGain]}
              onValueChange={(values) => setMicGain(values[0])}
              min={0.3}
              max={2.0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Quiet</span>
              <span>Normal</span>
              <span>Loud</span>
            </div>
          </div>
        </div>

        {/* Wake Word */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Wake Word Activation
          </h3>
          
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 text-xs">
              Wake words require continuous listening. This is an experimental feature.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label className="font-medium">Enable Wake Word</Label>
              <p className="text-xs text-gray-500 mt-1">
                Start listening when you say the wake word
              </p>
            </div>
            <Switch
              checked={wakeWordEnabled}
              onCheckedChange={setWakeWordEnabled}
            />
          </div>

          {wakeWordEnabled && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <Label>Custom Wake Word</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., hey assistant, hello computer"
                  value={wakeWord}
                  onChange={(e) => setWakeWord(e.target.value)}
                />
                <Button onClick={handleSaveWakeWord} variant="outline">
                  Save
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Current wake word: <strong>"{wakeWord}"</strong>
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNoiseReduction(false);
              setEchoCancellation(true);
              setAutoGainControl(true);
              setMicGain(1.0);
              setWakeWordEnabled(false);
              toast({ title: "Settings Reset", description: "Voice settings restored to defaults" });
            }}
            className="w-full"
          >
            Reset to Defaults
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}