import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Languages, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiClient } from "@/apis/client";

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export default function TranslationPanel({ onSettingsChange }) {
  const [translationEnabled, setTranslationEnabled] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_translation_enabled') || 'false');
    } catch { return false; }
  });
  const [targetLanguage, setTargetLanguage] = useState(() => {
    return localStorage.getItem('voice_translation_target') || 'en';
  });
  const [autoTranslate, setAutoTranslate] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_auto_translate') || 'false');
    } catch { return false; }
  });
  const [showOriginal, setShowOriginal] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voice_show_original') || 'true');
    } catch { return true; }
  });
  const { toast } = useToast();

  const handleEnableTranslation = (enabled) => {
    setTranslationEnabled(enabled);
    localStorage.setItem('voice_translation_enabled', JSON.stringify(enabled));
    if (onSettingsChange) onSettingsChange({ translationEnabled: enabled, targetLanguage, autoTranslate, showOriginal });
    
    toast({
      title: enabled ? "Translation Enabled" : "Translation Disabled",
      description: enabled ? `Messages will be translated to ${LANGUAGES.find(l => l.code === targetLanguage)?.name}` : "Real-time translation turned off"
    });
  };

  const handleTargetLanguageChange = (lang) => {
    setTargetLanguage(lang);
    localStorage.setItem('voice_translation_target', lang);
    if (onSettingsChange) onSettingsChange({ translationEnabled, targetLanguage: lang, autoTranslate, showOriginal });
  };

  const handleAutoTranslateChange = (enabled) => {
    setAutoTranslate(enabled);
    localStorage.setItem('voice_auto_translate', JSON.stringify(enabled));
    if (onSettingsChange) onSettingsChange({ translationEnabled, targetLanguage, autoTranslate: enabled, showOriginal });
  };

  const handleShowOriginalChange = (show) => {
    setShowOriginal(show);
    localStorage.setItem('voice_show_original', JSON.stringify(show));
    if (onSettingsChange) onSettingsChange({ translationEnabled, targetLanguage, autoTranslate, showOriginal: show });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Real-Time Translation
        </CardTitle>
        <CardDescription>Translate voice chat messages to your preferred language</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <Label className="font-medium">Enable Translation</Label>
            <p className="text-xs text-gray-500 mt-1">Translate AI responses in real-time</p>
          </div>
          <Switch
            checked={translationEnabled}
            onCheckedChange={handleEnableTranslation}
          />
        </div>

        {translationEnabled && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-2">
              <Label>Target Language</Label>
              <Select value={targetLanguage} onValueChange={handleTargetLanguageChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Auto-Translate User Input</Label>
                <p className="text-xs text-gray-500 mt-1">Also translate what you say</p>
              </div>
              <Switch
                checked={autoTranslate}
                onCheckedChange={handleAutoTranslateChange}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Show Original Text</Label>
                <p className="text-xs text-gray-500 mt-1">Display both original and translated</p>
              </div>
              <Switch
                checked={showOriginal}
                onCheckedChange={handleShowOriginalChange}
              />
            </div>

            <Badge variant="outline" className="w-full justify-center py-2">
              <Languages className="w-3 h-3 mr-2" />
              Translating to {LANGUAGES.find(l => l.code === targetLanguage)?.flag} {LANGUAGES.find(l => l.code === targetLanguage)?.name}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
