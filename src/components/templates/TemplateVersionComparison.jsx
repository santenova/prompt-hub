import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, GitCompare, Info, Undo2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function TemplateVersionComparison({ template, onRestoreVersion }) {
  const allVersions = [
    {
      version: template.version || 1,
      title: template.title,
      content: template.content,
      category: template.category,
      subcategory: template.subcategory,
      tags: template.tags || [],
      saved_date: template.updated_date || template.created_date,
      edited_by_name: template.created_by,
      change_notes: 'Current version'
    },
    ...(template.version_history || [])
  ].sort((a, b) => b.version - a.version);

  const [version1, setVersion1] = useState(allVersions[0]?.version);
  const [version2, setVersion2] = useState(allVersions[1]?.version || allVersions[0]?.version);

  const v1Data = allVersions.find(v => v.version === version1);
  const v2Data = allVersions.find(v => v.version === version2);

  const getDifferences = () => {
    if (!v1Data || !v2Data) return {};

    const differences = {
      title: v1Data.title !== v2Data.title,
      content: v1Data.content !== v2Data.content,
      category: v1Data.category !== v2Data.category,
      subcategory: v1Data.subcategory !== v2Data.subcategory,
      tags: JSON.stringify(v1Data.tags) !== JSON.stringify(v2Data.tags)
    };

    return differences;
  };

  const differences = getDifferences();
  const totalDifferences = Object.values(differences).filter(Boolean).length;

  const renderContentDiff = (content1, content2) => {
    const lines1 = (content1 || '').split('\n');
    const lines2 = (content2 || '').split('\n');
    const maxLines = Math.max(lines1.length, lines2.length);

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">Version {version1}</div>
          <div className="bg-gray-50 p-3 rounded border space-y-1 font-mono text-xs">
            {lines1.map((line, idx) => {
              const isDifferent = lines2[idx] !== line;
              return (
                <div
                  key={idx}
                  className={`${isDifferent ? 'bg-red-100 text-red-900' : ''} px-1 py-0.5 rounded`}
                >
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-600 mb-2">Version {version2}</div>
          <div className="bg-gray-50 p-3 rounded border space-y-1 font-mono text-xs">
            {lines2.map((line, idx) => {
              const isDifferent = lines1[idx] !== line;
              return (
                <div
                  key={idx}
                  className={`${isDifferent ? 'bg-green-100 text-green-900' : ''} px-1 py-0.5 rounded`}
                >
                  {line || '\u00A0'}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5" />
            Compare Versions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Version 1</label>
              <Select value={version1?.toString()} onValueChange={(val) => setVersion1(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allVersions.map((v) => (
                    <SelectItem key={v.version} value={v.version.toString()}>
                      v{v.version} {v.version === template.version && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Version 2</label>
              <Select value={version2?.toString()} onValueChange={(val) => setVersion2(Number(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allVersions.map((v) => (
                    <SelectItem key={v.version} value={v.version.toString()}>
                      v{v.version} {v.version === template.version && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {totalDifferences > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Found <strong>{totalDifferences}</strong> difference{totalDifferences !== 1 ? 's' : ''} between these versions
              </AlertDescription>
            </Alert>
          )}

          {totalDifferences === 0 && version1 !== version2 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No differences found between these versions
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {v1Data && v2Data && (
        <>
          {/* Version Metadata Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Version Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-600">Version {version1}</div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-2">{new Date(v1Data.saved_date).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">By:</span>
                      <span className="ml-2">{v1Data.edited_by_name || v1Data.edited_by || 'Unknown'}</span>
                    </div>
                    {v1Data.change_notes && (
                      <div>
                        <span className="text-gray-600">Notes:</span>
                        <p className="ml-2 italic">{v1Data.change_notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-600">Version {version2}</div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <span className="ml-2">{new Date(v2Data.saved_date).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">By:</span>
                      <span className="ml-2">{v2Data.edited_by_name || v2Data.edited_by || 'Unknown'}</span>
                    </div>
                    {v2Data.change_notes && (
                      <div>
                        <span className="text-gray-600">Notes:</span>
                        <p className="ml-2 italic">{v2Data.change_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Title Comparison */}
          {differences.title && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Title Changed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <div className="text-xs text-red-600 font-semibold mb-1">Version {version1}</div>
                    <div className="text-sm text-red-900">{v1Data.title}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <div className="text-xs text-green-600 font-semibold mb-1">Version {version2}</div>
                    <div className="text-sm text-green-900">{v2Data.title}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Category/Subcategory Comparison */}
          {(differences.category || differences.subcategory) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Changed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-2">Version {version1}</div>
                    <div className="space-x-2">
                      <Badge className={differences.category ? 'bg-red-100 text-red-800' : ''}>
                        {v1Data.category}
                      </Badge>
                      {v1Data.subcategory && (
                        <Badge variant="outline" className={differences.subcategory ? 'bg-red-100 text-red-800' : ''}>
                          {v1Data.subcategory}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-2">Version {version2}</div>
                    <div className="space-x-2">
                      <Badge className={differences.category ? 'bg-green-100 text-green-800' : ''}>
                        {v2Data.category}
                      </Badge>
                      {v2Data.subcategory && (
                        <Badge variant="outline" className={differences.subcategory ? 'bg-green-100 text-green-800' : ''}>
                          {v2Data.subcategory}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags Comparison */}
          {differences.tags && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tags Changed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-2">Version {version1}</div>
                    <div className="flex flex-wrap gap-2">
                      {(v1Data.tags || []).map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className={!(v2Data.tags || []).includes(tag) ? 'bg-red-100 text-red-800' : ''}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-2">Version {version2}</div>
                    <div className="flex flex-wrap gap-2">
                      {(v2Data.tags || []).map((tag, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className={!(v1Data.tags || []).includes(tag) ? 'bg-green-100 text-green-800' : ''}
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Comparison */}
          {differences.content && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Content Changed</CardTitle>
                  <div className="flex gap-2 text-xs">
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                      Removed
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                      Added
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {renderContentDiff(v1Data.content, v2Data.content)}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {version2 !== template.version && onRestoreVersion && (
              <Button
                onClick={() => onRestoreVersion(v2Data)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Restore Version {version2}
              </Button>
            )}
            {version1 !== template.version && onRestoreVersion && (
              <Button
                onClick={() => onRestoreVersion(v1Data)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Undo2 className="w-4 h-4 mr-2" />
                Restore Version {version1}
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}