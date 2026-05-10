import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  Copy, 
  CheckCircle2, 
  Key, 
  BookOpen,
  Terminal,
  Shield,
  AlertCircle,
  FileText,
  Users,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

export default function APIDocumentation() {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const baseUrl = 'https://prompt.only-agent.ai';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-6"
          >
            <div className="flex items-center justify-center gap-2">
              <Code className="w-12 h-12" />
              <h1 className="text-5xl font-bold">Publishing API</h1>
            </div>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Programmatically create and manage templates, personas, and content
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Badge className="bg-white/20 text-white text-sm py-2 px-4">
                <Terminal className="w-4 h-4 mr-2" />
                RESTful API
              </Badge>
              <Badge className="bg-white/20 text-white text-sm py-2 px-4">
                <Shield className="w-4 h-4 mr-2" />
                API Key Auth
              </Badge>
              <Badge className="bg-white/20 text-white text-sm py-2 px-4">
                <Code className="w-4 h-4 mr-2" />
                JSON Format
              </Badge>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-2">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <a href="#getting-started" className="block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                Getting Started
              </a>
              <a href="#authentication" className="block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                Authentication
              </a>
              <a href="#templates" className="block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                Templates API
              </a>
              <a href="#personas" className="block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                Personas API
              </a>
              <a href="#error-handling" className="block py-2 px-3 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
                Error Handling
              </a>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Getting Started */}
            <section id="getting-started">
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>Quick guide to using the Publishing API</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">1. Generate an API Key</h4>
                    <p className="text-sm text-gray-700">
                      Navigate to <Link to={createPageUrl('Settings')} className="text-blue-600 underline">Settings → Publishing API</Link> and create a new API key.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">2. Authenticate Your Requests</h4>
                    <p className="text-sm text-gray-700">
                      Include your API key in the Authorization header of all requests.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">3. Start Publishing</h4>
                    <p className="text-sm text-gray-700">
                      Use the API endpoints to create templates, personas, and manage your content programmatically.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Authentication */}
            <section id="authentication">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Key className="w-6 h-6 text-purple-600" />
                    Authentication
                  </CardTitle>
                  <CardDescription>Authenticate your API requests with API keys</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700 mb-2">
                    All API requests must include your API key in the x-api-key header:
                  </p>
                  <div className="bg-slate-900 p-4 rounded-lg relative">
                    <code className="text-green-400 text-sm">
                      x-api-key: pk_your_api_key_here
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-white hover:bg-white/10"
                      onClick={() => copyCode("x-api-key: pk_your_api_key_here", "auth-header")}
                    >
                      {copiedCode === "auth-header" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-gray-700 mt-4">
                    API endpoints follow this structure:
                  </p>
                  <div className="bg-slate-900 p-4 rounded-lg relative">
                    <code className="text-green-400 text-sm break-all">
                      {baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-white hover:bg-white/10"
                      onClick={() => copyCode(`${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory`, "endpoint-structure")}
                    >
                      {copiedCode === "endpoint-structure" ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-yellow-900">Security Best Practices</p>
                        <ul className="mt-2 space-y-1 text-yellow-800">
                          <li>• Never expose your API key in client-side code</li>
                          <li>• Store API keys securely as environment variables</li>
                          <li>• Delete compromised keys immediately</li>
                          <li>• Use different keys for different environments</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Templates API */}
            <section id="templates">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    Templates API
                  </CardTitle>
                  <CardDescription>Create and manage prompt templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* List Templates */}
                  <div className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-green-600">GET</Badge>
                      <code className="text-sm font-mono">/api/templates</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">List all templates for the authenticated user</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X GET ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X GET ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json"`, "list-templates")}
                      >
                        {copiedCode === "list-templates" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Create Template */}
                  <div className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-blue-600">POST</Badge>
                      <code className="text-sm font-mono">/api/templates</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">Create a new template</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X POST ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Product Description Generator",
    "content": "Write a compelling product description for {{product_name}}",
    "category": "Marketing",
    "tags": ["product", "marketing", "ecommerce"],
    "placeholders": [
      {
        "key": "product_name",
        "label": "Product Name",
        "type": "text",
        "required": true
      }
    ]
  }'`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X POST ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "title": "Product Description Generator",\n    "content": "Write a compelling product description for {{product_name}}",\n    "category": "Marketing",\n    "tags": ["product", "marketing", "ecommerce"],\n    "placeholders": [\n      {\n        "key": "product_name",\n        "label": "Product Name",\n        "type": "text",\n        "required": true\n      }\n    ]\n  }'`, "create-template")}
                      >
                        {copiedCode === "create-template" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Get Template */}
                  <div className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-green-600">GET</Badge>
                      <code className="text-sm font-mono">/api/templates/:id</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">Get a specific template by ID</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X GET ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X GET ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json"`, "get-template")}
                      >
                        {copiedCode === "get-template" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Update Template */}
                  <div className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-yellow-600">PUT</Badge>
                      <code className="text-sm font-mono">/api/templates/:id</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">Update an existing template</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X PUT ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Updated Title",
    "content": "Updated content"
  }'`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X PUT ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "title": "Updated Title",\n    "content": "Updated content"\n  }'`, "update-template")}
                      >
                        {copiedCode === "update-template" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Delete Template */}
                  <div className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-red-600">DELETE</Badge>
                      <code className="text-sm font-mono">/api/templates/:id</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">Delete a template</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X DELETE ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X DELETE ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json"`, "delete-template")}
                      >
                        {copiedCode === "delete-template" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Personas API */}
            <section id="personas">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Users className="w-6 h-6 text-purple-600" />
                    Personas API
                  </CardTitle>
                  <CardDescription>Create and manage AI personas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* List Personas */}
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-green-600">GET</Badge>
                      <code className="text-sm font-mono">/api/personas</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">List all personas for the authenticated user</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X GET ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X GET ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json"`, "list-personas")}
                      >
                        {copiedCode === "list-personas" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Create Persona */}
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-blue-600">POST</Badge>
                      <code className="text-sm font-mono">/api/personas</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">Create a new persona</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X POST ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Marketing Expert",
    "description": "AI marketing specialist with expertise in digital marketing",
    "category": "Marketing",
    "tone": "Professional",
    "instructions": "Provide marketing insights and strategies",
    "expertise_areas": ["SEO", "Content Marketing", "Social Media"],
    "tags": ["marketing", "digital", "strategy"]
  }'`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X POST ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "Marketing Expert",\n    "description": "AI marketing specialist with expertise in digital marketing",\n    "category": "Marketing",\n    "tone": "Professional",\n    "instructions": "Provide marketing insights and strategies",\n    "expertise_areas": ["SEO", "Content Marketing", "Social Media"],\n    "tags": ["marketing", "digital", "strategy"]\n  }'`, "create-persona")}
                      >
                        {copiedCode === "create-persona" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Get Persona */}
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-green-600">GET</Badge>
                      <code className="text-sm font-mono">/api/personas/:id</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">Get a specific persona by ID</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X GET ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X GET ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json"`, "get-persona")}
                      >
                        {copiedCode === "get-persona" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Update Persona */}
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-yellow-600">PUT</Badge>
                      <code className="text-sm font-mono">/api/personas/:id</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">Update an existing persona</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X PUT ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Updated Persona Name",
    "description": "Updated description"
  }'`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X PUT ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{\n    "name": "Updated Persona Name",\n    "description": "Updated description"\n  }'`, "update-persona")}
                      >
                        {copiedCode === "update-persona" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {/* Delete Persona */}
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-red-600">DELETE</Badge>
                      <code className="text-sm font-mono">/api/personas/:id</code>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">Delete a persona</p>
                    
                    <div className="bg-slate-900 p-4 rounded-lg relative mt-3">
                      <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X DELETE ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\
  -H "x-api-key: pk_your_api_key_here" \\
  -H "Content-Type: application/json"`}
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-white hover:bg-white/10"
                        onClick={() => copyCode(`curl -X DELETE ${baseUrl}/api/apps/YOUR_APP_ID/functions/apiContentHistory \\\n  -H "x-api-key: pk_your_api_key_here" \\\n  -H "Content-Type: application/json"`, "delete-persona")}
                      >
                        {copiedCode === "delete-persona" ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Error Handling */}
            <section id="error-handling">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    Error Handling
                  </CardTitle>
                  <CardDescription>Understanding API error responses</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700">
                    The API uses standard HTTP status codes and returns detailed error messages in JSON format:
                  </p>

                  <div className="space-y-3">
                    {[
                      { code: 400, title: "Bad Request", desc: "Invalid parameters or malformed request body" },
                      { code: 401, title: "Unauthorized", desc: "Invalid or missing API key" },
                      { code: 403, title: "Forbidden", desc: "API key doesn't have required permissions" },
                      { code: 404, title: "Not Found", desc: "Resource not found" },
                      { code: 429, title: "Too Many Requests", desc: "Rate limit exceeded" },
                      { code: 500, title: "Internal Server Error", desc: "Server error - please contact support" }
                    ].map((error) => (
                      <div key={error.code} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge variant="outline" className="mt-1">{error.code}</Badge>
                        <div>
                          <p className="font-semibold text-sm">{error.title}</p>
                          <p className="text-xs text-gray-600">{error.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-900 p-4 rounded-lg mt-4">
                    <p className="text-white text-xs mb-2">Example Error Response:</p>
                    <pre className="text-red-400 text-sm overflow-x-auto">
{`{
  "error": {
    "code": "unauthorized",
    "message": "Invalid API key",
    "details": "The provided API key is invalid or has been revoked"
  }
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Need Help */}
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardHeader>
                <CardTitle>Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-700">
                  If you have questions or need assistance with the Publishing API:
                </p>
                <div className="flex gap-3">
                  <Link to={createPageUrl('Settings')}>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Manage API Keys
                    </Button>
                  </Link>
                  <Link to={createPageUrl('Help')}>
                    <Button variant="outline">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Help Center
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}