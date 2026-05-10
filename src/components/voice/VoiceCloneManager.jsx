import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, Upload, Sparkles, Loader2, Check, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/apis/client";

export default function VoiceCloneManager({ apiKey, onVoiceCreated }) {
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [audioFiles, setAudioFiles] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [customVoices, setCustomVoices] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('elevenlabs_custom_voices') || '[]');
    } catch { return []; }
  });
  const { toast } = useToast();

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (audioFiles.length + files.length > 5) {
      toast({
        title: "Too Many Files",
        description: "Maximum 5 audio samples allowed",
        variant: "destructive"
      });
      return;
    }
    setAudioFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setAudioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const createVoice = async () => {
    if (!voiceName.trim()) {
      toast({ title: "Name Required", description: "Please enter a voice name", variant: "destructive" });
      return;
    }

    if (audioFiles.length === 0) {
      toast({ title: "Audio Required", description: "Upload at least one audio sample", variant: "destructive" });
      return;
    }

    if (!apiKey) {
      toast({ title: "API Key Missing", description: "Configure ElevenLabs API key in settings", variant: "destructive" });
      return;
    }

    setIsCreating(true);

    try {
      const formData = new FormData();
      formData.append('name', voiceName);
      if (voiceDescription) formData.append('description', voiceDescription);
      
      audioFiles.forEach((file, idx) => {
        formData.append('files', file);
      });

      const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Failed to create voice');
      }

      const data = await response.json();
      
      const newVoice = {
        voice_id: data.voice_id,
        name: voiceName,
        description: voiceDescription,
        created_at: new Date().toISOString()
      };

      const updated = [...customVoices, newVoice];
      setCustomVoices(updated);
      localStorage.setItem('elevenlabs_custom_voices', JSON.stringify(updated));

      if (onVoiceCreated) onVoiceCreated(data.voice_id);

      toast({
        title: "Voice Created!",
        description: `${voiceName} is ready to use`
      });

      setVoiceName('');
      setVoiceDescription('');
      setAudioFiles([]);
    } catch (error) {
      const errorMsg = error?.message || error?.toString() || 'Voice creation failed';
      console.error('Voice creation error:', errorMsg, error);
      toast({
        title: "Creation Failed",
        description: errorMsg,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteVoice = async (voiceId, index) => {
    try {
      await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
        method: 'DELETE',
        headers: {
          'xi-api-key': apiKey
        }
      });

      const updated = customVoices.filter((_, i) => i !== index);
      setCustomVoices(updated);
      localStorage.setItem('elevenlabs_custom_voices', JSON.stringify(updated));

      toast({ title: "Voice Deleted" });
    } catch (error) {
      const errorMsg = error?.message || error?.toString() || 'Voice deletion failed';
      console.error('Voice deletion error:', errorMsg, error);
      toast({
        title: "Delete Failed",
        description: errorMsg,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-purple-600" />
          AI Voice Cloning
        </CardTitle>
        <CardDescription>Create custom AI voices from audio samples</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            Upload 1-5 audio samples (1-10 min each) of clear speech. Best results with varied emotions and tones.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Voice Name</Label>
            <Input
              placeholder="e.g., My Professional Voice"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              placeholder="Describe the voice characteristics..."
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Audio Samples (Max 5)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="voice-upload"
                disabled={audioFiles.length >= 5}
              />
              <label htmlFor="voice-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">Click to upload audio files</p>
                <p className="text-xs text-gray-500 mt-1">MP3, WAV, or other audio formats</p>
              </label>
            </div>

            {audioFiles.length > 0 && (
              <div className="space-y-2">
                {audioFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm truncate">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(idx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={createVoice}
            disabled={isCreating || !voiceName.trim() || audioFiles.length === 0}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {isCreating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isCreating ? 'Creating Voice...' : 'Create Custom Voice'}
          </Button>
        </div>

        {customVoices.length > 0 && (
          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Your Custom Voices</Label>
            <div className="space-y-2">
              {customVoices.map((voice, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{voice.name}</p>
                    <p className="text-xs text-gray-500">ID: {voice.voice_id}</p>
                    <p className="text-xs text-gray-400">{new Date(voice.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(voice.voice_id);
                        toast({ title: "Copied", description: "Voice ID copied to clipboard" });
                      }}
                    >
                      Copy ID
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteVoice(voice.voice_id, idx)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
