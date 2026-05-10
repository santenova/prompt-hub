import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  GitCompare, 
  ArrowRight, 
  Plus, 
  Minus,
  Info,
  RotateCcw
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VersionCompare({ template, onRestoreVersion }) {
  const [version1, setVersion1] = useState(null);
  const [version2, setVersion2] = useState(null);

  const versions = [
    {
      version: template.version || 1,
      title: template.title,
      content: template.content,
      saved_date: template.updated_date || template.created_date,
      edited_by_name: 'Current Version',
      change_notes: 'Current active version'
    },
    ...(template.version_history || [])
  ].sort((a, b) => b.version - a.version);

  const getDiff = (oldText, newText) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    const diff = [];
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      
      if (oldLine === newLine) {
        diff.push({ type: 'unchanged', line: oldLine });
      } else if (!oldLine) {
        diff.push({ type: 'added', line: newLine });
      } else if (!newLine) {
        diff.push({ type: 'removed', line: oldLine });
      } else {
        diff.push({ type: 'removed', line: oldLine });
        diff.push({ type: 'added', line: newLine });
      }
    }
    
    return diff;
  };

  const getStats = () => {
    if (!version1 || !version2) return null;

    const diff = getDiff(version1.content, version2.content);
    const added = diff.filter(d => d.type === 'added').length;
    const removed = diff.filter(d => d.type === 'removed').length;
    const unchanged = diff.filter(d => d.type === 'unchanged').length;

    return { added, removed, unchanged, total: diff.length };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-600" />
            Compare Versions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Version 1 Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Compare from:</label>
              <Select value={version1?.version?.toString()} onValueChange={(v) => {
                const ver = versions.find(ver => ver.version.toString() === v);
                setVersion1(ver);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version..." />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((ver) => (
                    <SelectItem key={ver.version} value={ver.version.toString()}>
                      <div className="flex items-center gap-2">
                        <span>v{ver.version}</span>
                        {ver.version === template.version && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Version 2 Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">To:</label>
              <Select value={version2?.version?.toString()} onValueChange={(v) => {
                const ver = versions.find(ver => ver.version.toString() === v);
                setVersion2(ver);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select version..." />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((ver) => (
                    <SelectItem key={ver.version} value={ver.version.toString()}>
                      <div className="flex items-center gap-2">
                        <span>v{ver.version}</span>
                        {ver.version === template.version && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {version1 && version2 && version1.version !== version2.version && (
            <>
              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <Plus className="w-4 h-4" />
                      <span className="text-2xl font-bold">{stats.added}</span>
                    </div>
                    <p className="text-xs text-gray-600">Lines Added</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                      <Minus className="w-4 h-4" />
                      <span className="text-2xl font-bold">{stats.removed}</span>
                    </div>
                    <p className="text-xs text-gray-600">Lines Removed</p>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-600 mb-1">
                      <span className="text-2xl font-bold">{stats.unchanged}</span>
                    </div>
                    <p className="text-xs text-gray-600">Unchanged</p>
                  </div>
                </div>
              )}

              {/* Version Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-blue-50">
                  <CardContent className="pt-4">
                    <Badge className="mb-2">v{version1.version}</Badge>
                    <p className="text-sm font-medium">{version1.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(version1.saved_date).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      By {version1.edited_by_name}
                    </p>
                    {version1.change_notes && (
                      <p className="text-xs italic text-gray-700 mt-2">
                        "{version1.change_notes}"
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-purple-50">
                  <CardContent className="pt-4">
                    <Badge className="mb-2">v{version2.version}</Badge>
                    <p className="text-sm font-medium">{version2.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(version2.saved_date).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      By {version2.edited_by_name}
                    </p>
                    {version2.change_notes && (
                      <p className="text-xs italic text-gray-700 mt-2">
                        "{version2.change_notes}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Diff View */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Changes:</label>
                <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                  <pre className="text-xs font-mono leading-relaxed">
                    {getDiff(version1.content, version2.content).map((line, idx) => (
                      <div
                        key={idx}
                        className={`${
                          line.type === 'added'
                            ? 'bg-green-100 text-green-800'
                            : line.type === 'removed'
                            ? 'bg-red-100 text-red-800'
                            : ''
                        } px-2 py-0.5`}
                      >
                        <span className="inline-block w-6">
                          {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                        </span>
                        {line.line || ' '}
                      </div>
                    ))}
                  </pre>
                </div>
              </div>

              {/* Restore Action */}
              {version1.version !== template.version && onRestoreVersion && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        Restore version {version1.version} as the current version?
                      </span>
                      <Button
                        size="sm"
                        onClick={() => onRestoreVersion(version1)}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Restore v{version1.version}
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {version1 && version2 && version1.version === version2.version && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Please select two different versions to compare.
              </AlertDescription>
            </Alert>
          )}

          {(!version1 || !version2) && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select two versions to see the differences between them.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}