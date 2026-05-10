import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Server, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Database,
  Upload,
  Download,
  Settings,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  FileText,
  Zap,
  Trash2,
  Info,
  Image,
  File
} from "lucide-react";
import { apiClient } from "@/apis/client";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import MinIOSetupWizard from "../components/minio/MinIOSetupWizard";
import ObjectDetailsModal from "../components/minio/ObjectDetailsModal";

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState('idle');
  const [testResults, setTestResults] = useState({});
  const [isTesting, setIsTesting] = useState(false);
  const [bucketInfo, setBucketInfo] = useState(null);
  const [testFile, setTestFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [customBucket, setCustomBucket] = useState('2026');
  const [customPrefix, setCustomPrefix] = useState('');
  const [listBucket, setListBucket] = useState('2026');
  const [listPrefix, setListPrefix] = useState('');
  const [objectsList, setObjectsList] = useState([]);
  const [isLoadingObjects, setIsLoadingObjects] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState({ min: '', max: '' });
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [selectedObject, setSelectedObject] = useState(null);
  const [showObjectDetails, setShowObjectDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    try {
      const bases = await apiClient.entities.KnowledgeBase.list();
      setKnowledgeBases(bases || []);
    } catch (error) {
      console.error('Failed to load knowledge bases:', error);
    }
  };

  const listObjects = async () => {
    setIsLoadingObjects(true);
    try {
      const response = await apiClient.functions.invoke('testMinIOBucket', {
        bucket: listBucket,
        prefix: listPrefix,
        nameFilter,
        minSize: sizeFilter.min ? parseInt(sizeFilter.min) : 0,
        maxSize: sizeFilter.max ? parseInt(sizeFilter.max) : Infinity
      });

      if (response.data.success && response.data.bucket.exists) {
        setObjectsList(response.data.bucket.objects || []);
        toast({
          title: "Objects Loaded",
          description: `Found ${response.data.bucket.objectCount} objects`
        });
      } else {
        setObjectsList([]);
        toast({
          title: "Bucket Not Found",
          description: `Bucket '${listBucket}' does not exist`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Failed to List Objects",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingObjects(false);
    }
  };

  const handleDownloadObject = async (obj) => {
    try {
      toast({ title: "Generating Download Link...", description: "Please wait" });
      const response = await apiClient.functions.invoke('getMinIODownloadUrl', {
        bucket: listBucket,
        objectName: obj.name
      });

      if (response.data.success) {
        window.open(response.data.url, '_blank');
        toast({
          title: "Download Started",
          description: "File download link opened in new tab"
        });
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteObject = async (obj) => {
    if (!confirm(`Are you sure you want to delete "${obj.name}"?`)) {
      return;
    }

    try {
      const response = await apiClient.functions.invoke('deleteMinIOObject', {
        bucket: listBucket,
        objectName: obj.name
      });

      if (response.data.success) {
        setObjectsList(objectsList.filter(o => o.name !== obj.name));
        toast({
          title: "Object Deleted",
          description: `${obj.name} has been removed`
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getFileTypeIcon = (name) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
      return { icon: 'Image', color: 'text-blue-600', bg: 'bg-blue-50' };
    } else if (['txt', 'md', 'json', 'csv'].includes(ext)) {
      return { icon: 'FileText', color: 'text-green-600', bg: 'bg-green-50' };
    } else if (['pdf'].includes(ext)) {
      return { icon: 'FileText', color: 'text-red-600', bg: 'bg-red-50' };
    }
    return { icon: 'File', color: 'text-gray-600', bg: 'bg-gray-50' };
  };

  const testMinIOConnection = async () => {
    setIsTesting(true);
    setConnectionStatus('testing');
    const results = {};

    try {
      // Test 1: Configuration Check
      toast({ title: "Testing MinIO", description: "Checking configuration..." });
      
      // Test 2: Bucket Read Test via Backend Function
      toast({ title: "Testing MinIO", description: "Testing bucket access..." });
      const response = await apiClient.functions.invoke('testMinIOBucket', {
        bucket: listBucket
      });
      
      if (response.data.success) {
        results.config = {
          status: 'success',
          message: 'MinIO connection successful',
          details: {
            endpoint: response.data.config.endpoint,
            port: response.data.config.port,
            useSSL: response.data.config.useSSL ? 'Yes' : 'No',
            bucket: response.data.config.bucket
          }
        };

        results.bucket = {
          status: response.data.bucket.exists ? 'success' : 'warning',
          message: response.data.bucket.exists 
            ? `Bucket '${response.data.bucket.name}' found with ${response.data.bucket.objectCount} objects`
            : `Bucket '${response.data.bucket.name}' does not exist`,
          details: {
            exists: response.data.bucket.exists ? 'Yes' : 'No',
            objectCount: response.data.bucket.objectCount || 0
          }
        };

        setConnectionStatus('success');
        toast({ 
          title: "Connection Test Complete", 
          description: "MinIO is working correctly"
        });
      } else {
        throw new Error(response.data.error || 'Test failed');
      }

    } catch (error) {
      results.error = {
        status: 'error',
        message: error.message || error.toString(),
        details: error.response?.data || {}
      };
      setConnectionStatus('error');
      toast({ 
        title: "Connection Test Failed", 
        description: error.message || error.toString(),
        variant: "destructive"
      });
    } finally {
      setTestResults(results);
      setIsTesting(false);
    }
  };

  const testFileUpload = async () => {
    if (!testFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    let testKB = knowledgeBases[0];
    
    // If no knowledge base exists, create one for testing
    if (!testKB) {
      try {
        toast({ title: "Creating Test Knowledge Base", description: "Setting up test environment..." });
        testKB = await apiClient.entities.KnowledgeBase.create({
          name: 'Test Knowledge Base',
          description: 'Created for MinIO upload testing',
          model: 'nomic-embed-text',
          chunk_size: 500,
          chunk_overlap: 50
        });
        setKnowledgeBases([testKB, ...knowledgeBases]);
      } catch (error) {
        toast({
          title: "Failed to Create Knowledge Base",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
    }

    setIsTesting(true);
    try {
      // Step 1: Upload to Backend storage first
      toast({ title: "Uploading", description: "Uploading to Backend storage..." });
      const { file_url } = await apiClient.integrations.Core.UploadFile({ file: testFile });

      // Step 2: Test MinIO by calling the upload function with the file URL
      toast({ title: "Testing MinIO", description: "Transferring to MinIO storage..." });
      
      const response = await apiClient.functions.invoke('uploadToMinIO', {
        file_url: file_url,
        knowledge_base_id: testKB.id,
        original_filename: testFile.name,
        bucket: customBucket,
        prefix: customPrefix
      });

      setUploadResult({
        status: 'success',
        url: response.data.file_url,
        fileName: testFile.name,
        fileSize: testFile.size,
        bucket: response.data.bucket || '2026',
        objectName: response.data.object_name
      });

      toast({
        title: "Upload Successful",
        description: `${testFile.name} uploaded to MinIO bucket: ${response.data.bucket}`
      });
    } catch (error) {
      setUploadResult({
        status: 'error',
        error: error.message || error.toString()
      });
      toast({
        title: "Upload Failed",
        description: error.message || error.toString(),
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    const variants = {
      success: { icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-300' },
      error: { icon: XCircle, color: 'bg-red-100 text-red-700 border-red-300' },
      warning: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      testing: { icon: Loader2, color: 'bg-blue-100 text-blue-700 border-blue-300' }
    };

    const variant = variants[status] || variants.warning;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} border`}>
        <Icon className={`w-3 h-3 mr-1 ${status === 'testing' ? 'animate-spin' : ''}`} />
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MinIO RAG Test Suite</h1>
            <p className="text-gray-600">Test and diagnose MinIO configuration for Vector RAG</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowSetupWizard(true)}
              variant="outline"
              size="lg"
            >
              <Settings className="w-5 h-5 mr-2" />
              Setup Wizard
            </Button>
            <Button
              onClick={testMinIOConnection}
              disabled={isTesting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
              size="lg"
            >
              {isTesting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Testing...</>
              ) : (
                <><Zap className="w-5 h-5 mr-2" /> Run Full Test</>
              )}
            </Button>
          </div>
        </div>

        {/* Connection Status Overview */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-blue-600" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">MinIO Object Storage</p>
                <p className="text-xs text-gray-500 mt-1">Bucket: 2026</p>
              </div>
              <StatusBadge status={connectionStatus} />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Results */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="w-5 h-5 text-green-600" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {Object.keys(testResults).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No tests run yet</p>
                    <p className="text-xs mt-1">Click "Run Full Test" to begin</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-3">
                      {Object.entries(testResults).map(([key, result]) => (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-lg border-2 ${
                            result.status === 'success' 
                              ? 'border-green-200 bg-green-50' 
                              : result.status === 'error'
                              ? 'border-red-200 bg-red-50'
                              : 'border-yellow-200 bg-yellow-50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-semibold text-sm capitalize">{key} Test</p>
                            <StatusBadge status={result.status} />
                          </div>
                          <p className="text-xs text-gray-700 mb-2">{result.message}</p>
                          {result.details && Object.keys(result.details).length > 0 && (
                            <div className="bg-white/50 p-2 rounded text-xs space-y-1">
                              {Object.entries(result.details).map(([k, v]) => (
                                <div key={k} className="flex justify-between">
                                  <span className="text-gray-600">{k}:</span>
                                  <span className="font-medium">
                                    {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* File Upload Test */}
          <Card className="border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="w-5 h-5 text-purple-600" />
                File Upload Test
              </CardTitle>
              <CardDescription>Test MinIO file upload functionality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="bucket">Destination Bucket</Label>
                  <Input
                    id="bucket"
                    value={customBucket}
                    onChange={(e) => setCustomBucket(e.target.value)}
                    placeholder="2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefix (Optional)</Label>
                  <Input
                    id="prefix"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    placeholder="e.g. uploads/docs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-file">Select Test File</Label>
                <Input
                  id="test-file"
                  type="file"
                  onChange={(e) => setTestFile(e.target.files[0])}
                  accept=".txt,.pdf,.docx"
                />
                {testFile && (
                  <div className="text-xs text-gray-600 flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    {testFile.name} ({(testFile.size / 1024).toFixed(2)} KB)
                  </div>
                )}
              </div>

              <Button
                onClick={testFileUpload}
                disabled={!testFile || isTesting}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600"
              >
                {isTesting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Upload Test File</>
                )}
              </Button>

              {knowledgeBases.length === 0 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-xs text-yellow-700">
                    No knowledge base found. A test knowledge base will be created automatically when you upload.
                  </AlertDescription>
                </Alert>
              )}

              {uploadResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg border-2 ${
                    uploadResult.status === 'success'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {uploadResult.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {uploadResult.status === 'success' ? 'Upload Successful' : 'Upload Failed'}
                      </p>
                      {uploadResult.status === 'success' ? (
                        <div className="mt-2 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">File:</span>
                            <span className="font-medium">{uploadResult.fileName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Size:</span>
                            <span className="font-medium">{(uploadResult.fileSize / 1024).toFixed(2)} KB</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Bucket:</span>
                            <span className="font-medium">{uploadResult.bucket}</span>
                          </div>
                          {uploadResult.objectName && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Object:</span>
                              <span className="font-mono text-xs">{uploadResult.objectName.split('/').pop()}</span>
                            </div>
                          )}
                          {uploadResult.url && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-gray-600 mb-1">Presigned URL:</p>
                              <code className="text-xs bg-white p-1 rounded block break-all">
                                {uploadResult.url.substring(0, 80)}...
                              </code>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => {
                                  navigator.clipboard.writeText(uploadResult.url);
                                  toast({ title: "Copied!", description: "URL copied to clipboard" });
                                }}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Copy Full URL
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-red-700 mt-1">{uploadResult.error}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Bases Overview */}
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
                Knowledge Bases ({knowledgeBases.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={loadKnowledgeBases}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {knowledgeBases.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No knowledge bases created yet</p>
                <p className="text-xs mt-1 text-gray-400">Create one in the Vector RAG panel to test</p>
              </div>
            ) : (
              <div className="space-y-2">
                {knowledgeBases.map((kb) => (
                  <Card key={kb.id} className="border border-gray-200 bg-white">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{kb.name}</p>
                          <p className="text-xs text-gray-600">{kb.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {kb.document_count || 0} docs
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {kb.model || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration Details */}
        <Card className="border-2 border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              Configuration Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {testResults.config?.details ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Endpoint</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {testResults.config.details.endpoint}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Port</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {testResults.config.details.port}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Use SSL</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      {testResults.config.details.useSSL}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Bucket</span>
                    <Badge className="font-mono text-xs bg-blue-600">
                      {testResults.config.details.bucket}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Access Key</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      Configured ✓
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Secret Key</span>
                    <Badge variant="outline" className="font-mono text-xs">
                      Configured ✓
                    </Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Settings className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Run a connection test to see configuration details</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Object Browser */}
        <Card className="border-2 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-emerald-600" />
              Object Browser
            </CardTitle>
            <CardDescription>List and filter objects in MinIO buckets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Bucket</Label>
                <Input
                  value={listBucket}
                  onChange={(e) => setListBucket(e.target.value)}
                  placeholder="2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Prefix</Label>
                <Input
                  value={listPrefix}
                  onChange={(e) => setListPrefix(e.target.value)}
                  placeholder="e.g. uploads/"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Name Filter</Label>
              <Input
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="Filter by name..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Min Size (bytes)</Label>
                <Input
                  type="number"
                  value={sizeFilter.min}
                  onChange={(e) => setSizeFilter({ ...sizeFilter, min: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Size (bytes)</Label>
                <Input
                  type="number"
                  value={sizeFilter.max}
                  onChange={(e) => setSizeFilter({ ...sizeFilter, max: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <Button
              onClick={listObjects}
              disabled={isLoadingObjects}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600"
            >
              {isLoadingObjects ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
              ) : (
                <><FolderOpen className="w-4 h-4 mr-2" /> List Objects</>
              )}
            </Button>

            {objectsList.length > 0 && (
              <ScrollArea className="h-[400px] border rounded-lg p-3 bg-white">
                <div className="space-y-2">
                  {objectsList.map((obj, idx) => {
                    const fileType = getFileTypeIcon(obj.name);
                    const IconComponent = fileType.icon === 'Image' ? Image : fileType.icon === 'FileText' ? FileText : File;
                    
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="p-3 border rounded-lg hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`p-2 rounded-lg ${fileType.bg} flex-shrink-0`}>
                            <IconComponent className={`w-5 h-5 ${fileType.color}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{obj.name}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                              <span>{(obj.size / 1024).toFixed(2)} KB</span>
                              <span>•</span>
                              <span>{new Date(obj.lastModified).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedObject(obj);
                                setShowObjectDetails(true);
                              }}
                              title="View Details"
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadObject(obj)}
                              title="Download"
                            >
                              <Download className="w-4 h-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteObject(obj)}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}

            {objectsList.length === 0 && !isLoadingObjects && (
              <div className="text-center py-6 text-gray-500 border rounded-lg bg-gray-50">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No objects found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-2 border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-sm">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSetupWizard(true)}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Configuration Wizard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/VoiceToPrompt'}
                className="gap-2"
              >
                <Database className="w-4 h-4" />
                Go to Vector RAG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadKnowledgeBases}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <MinIOSetupWizard 
        open={showSetupWizard} 
        onOpenChange={setShowSetupWizard}
      />

      <ObjectDetailsModal
        object={selectedObject}
        bucket={listBucket}
        open={showObjectDetails}
        onOpenChange={setShowObjectDetails}
        onDownload={handleDownloadObject}
      />
    </div>
  );
}
