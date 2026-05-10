import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Mic, 
  Volume2, 
  Filter, 
  Gauge,
  AlertCircle,
  CheckCircle2
} from "lucide-react";

const EXTENDED_LANGUAGES = [
  { code: "en-US", label: "English (US)", flag: "🇺🇸", quality: "excellent" },
  { code: "en-GB", label: "English (UK)", flag: "🇬🇧", quality: "excellent" },
  { code: "en-AU", label: "English (Australia)", flag: "🇦🇺", quality: "excellent" },
  { code: "en-IN", label: "English (India)", flag: "🇮🇳", quality: "good" },
  { code: "es-ES", label: "Spanish (Spain)", flag: "🇪🇸", quality: "excellent" },
  { code: "es-MX", label: "Spanish (Mexico)", flag: "🇲🇽", quality: "excellent" },
  { code: "fr-FR", label: "French (France)", flag: "🇫🇷", quality: "excellent" },
  { code: "fr-CA", label: "French (Canada)", flag: "🇨🇦", quality: "good" },
  { code: "de-DE", label: "German", flag: "🇩🇪", quality: "excellent" },
  { code: "it-IT", label: "Italian", flag: "🇮🇹", quality: "excellent" },
  { code: "pt-BR", label: "Portuguese (Brazil)", flag: "🇧🇷", quality: "excellent" },
  { code: "pt-PT", label: "Portuguese (Portugal)", flag: "🇵🇹", quality: "good" },
  { code: "zh-CN", label: "Chinese (Mandarin)", flag: "🇨🇳", quality: "good" },
  { code: "ja-JP", label: "Japanese", flag: "🇯🇵", quality: "excellent" },
  { code: "ko-KR", label: "Korean", flag: "🇰🇷", quality: "good" },
  { code: "hi-IN", label: "Hindi", flag: "🇮🇳", quality: "good" },
  { code: "ar-SA", label: "Arabic", flag: "🇸🇦", quality: "good" },
  { code: "ru-RU", label: "Russian", flag: "🇷🇺", quality: "good" },
  { code: "nl-NL", label: "Dutch", flag: "🇳🇱", quality: "excellent" },
  { code: "pl-PL", label: "Polish", flag: "🇵🇱", quality: "good" },
  { code: "tr-TR", label: "Turkish", flag: "🇹🇷", quality: "good" },
  { code: "sv-SE", label: "Swedish", flag: "🇸🇪", quality: "excellent" },
  { code: "da-DK", label: "Danish", flag: "🇩🇰", quality: "good" },
  { code: "no-NO", label: "Norwegian", flag: "🇳🇴", quality: "good" },
  { code: "fi-FI", label: "Finnish", flag: "🇫🇮", quality: "good" },
  { code: "cs-CZ", label: "Czech", flag: "🇨🇿", quality: "good" },
  { code: "th-TH", label: "Thai", flag: "🇹🇭", quality: "fair" },
  { code: "vi-VN", label: "Vietnamese", flag: "🇻🇳", quality: "fair" },
  { code: "id-ID", label: "Indonesian", flag: "🇮🇩", quality: "good" },
  { code: "uk-UA", label: "Ukrainian", flag: "🇺🇦", quality: "good" }
];

export default function AdvancedVoiceSettings({
  selectedLanguage,
  onLanguageChange,
  noiseReduction,
  onNoiseReductionChange,
  autoGainControl,
  onAutoGainControlChange,
  echoCancellation,
  onEchoCancellationChange,
  sensitivity,
  onSensitivityChange
}) {
  const currentLanguage = EXTENDED_LANGUAGES.find(l => l.code === selectedLanguage);

  const getQualityBadge = (quality) => {
    const colors = {
      excellent: 'bg-green-100 text-green-700',
      good: 'bg-blue-100 text-blue-700',
      fair: 'bg-yellow-100 text-yellow-700'
    };
    return colors[quality] || colors.fair;
  };

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mic className="w-5 h-5 text-purple-600" />
          Advanced Voice Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-2">
          <Label>Recognition Language</Label>
          <Select value={selectedLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {EXTENDED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center justify-between w-full gap-2">
                    <span>
                      {lang.flag} {lang.label}
                    </span>
                    <Badge className={`${getQualityBadge(lang.quality)} text-xs`}>
                      {lang.quality}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentLanguage && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <CheckCircle2 className="w-3 h-3" />
              <span>Recognition quality: {currentLanguage.quality}</span>
            </div>
          )}
        </div>

        {/* Audio Processing */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Audio Processing
          </h4>

          <div className="space-y-4">
            {/* Noise Reduction */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Noise Reduction</Label>
                <p className="text-xs text-gray-500">
                  Reduce background noise for clearer transcription
                </p>
              </div>
              <Switch
                checked={noiseReduction}
                onCheckedChange={onNoiseReductionChange}
              />
            </div>

            {/* Auto Gain Control */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Auto Gain Control</Label>
                <p className="text-xs text-gray-500">
                  Automatically adjust microphone volume
                </p>
              </div>
              <Switch
                checked={autoGainControl}
                onCheckedChange={onAutoGainControlChange}
              />
            </div>

            {/* Echo Cancellation */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm">Echo Cancellation</Label>
                <p className="text-xs text-gray-500">
                  Prevent audio feedback and echo
                </p>
              </div>
              <Switch
                checked={echoCancellation}
                onCheckedChange={onEchoCancellationChange}
              />
            </div>
          </div>
        </div>

        {/* Sensitivity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Detection Sensitivity
            </Label>
            <span className="text-xs text-gray-600">{sensitivity}%</span>
          </div>
          <Slider
            value={[sensitivity]}
            onValueChange={(values) => onSensitivityChange(values[0])}
            min={50}
            max={100}
            step={5}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Higher sensitivity detects quieter speech but may pick up more noise
          </p>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-800">
              <p className="font-medium">Browser-based Recognition</p>
              <p className="mt-1">
                Speech recognition quality depends on your browser and requires an internet connection.
                For offline support, consider using local speech recognition models (external setup required).
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}