import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Server, 
  Key, 
  Shield, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Copy,
  AlertCircle,
  Info,
  Zap,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function MinIOSetupWizard({ open, onOpenChange }) {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState({
    endpoint: '',
    port: '9000',
    useSSL: false,
    accessKey: '',
    secretKey: ''
  });
  const [errors, setErrors] = useState({});
  const { toast } = useToast();

  const steps = [
    {
      title: 'MinIO Endpoint',
      icon: Server,
      description: 'Enter your MinIO server endpoint (hostname or IP address)',
      field: 'endpoint',
      placeholder: 'localhost or minio.example.com',
      hint: 'For local development, use "localhost". For production, use your MinIO server domain.',
      examples: ['localhost', 'minio.mycompany.com', '192.168.1.100']
    },
    {
      title: 'Port Configuration',
      icon: Server,
      description: 'Enter the port your MinIO server is running on',
      field: 'port',
      placeholder: '9000',
      hint: 'Default MinIO port is 9000. MinIO Console typically uses 9001.',
      examples: ['9000', '9001', '443']
    },
    {
      title: 'SSL/TLS Settings',
      icon: Shield,
      description: 'Enable SSL/TLS for secure connections',
      field: 'useSSL',
      hint: 'Enable SSL if your MinIO server uses HTTPS. Disable for local development.',
      isSwitch: true
    },
    {
      title: 'Access Key',
      icon: Key,
      description: 'Enter your MinIO access key (username)',
      field: 'accessKey',
      placeholder: 'minioadmin',
      hint: 'This is like a username. Default is "minioadmin" for local installations.',
      examples: ['minioadmin', 'admin', 'your-access-key']
    },
    {
      title: 'Secret Key',
      icon: Shield,
      description: 'Enter your MinIO secret key (password)',
      field: 'secretKey',
      placeholder: 'minioadmin',
      hint: 'This is like a password. Keep it secure! Default is "minioadmin" for local installations.',
      isPassword: true
    }
  ];

  const validateStep = (stepIndex) => {
    const currentStep = steps[stepIndex];
    if (currentStep.isSwitch) return true;

    const value = config[currentStep.field];
    const newErrors = {};

    if (!value || value.trim() === '') {
      newErrors[currentStep.field] = 'This field is required';
    } else if (currentStep.field === 'port') {
      const port = parseInt(value);
      if (isNaN(port) || port < 1 || port > 65535) {
        newErrors[currentStep.field] = 'Port must be between 1 and 65535';
      }
    } else if (currentStep.field === 'endpoint') {
      // Basic validation for endpoint
      if (value.includes('http://') || value.includes('https://')) {
        newErrors[currentStep.field] = 'Enter hostname only, without http:// or https://';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < steps.length) {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Configuration copied to clipboard" });
  };

  const generateEnvVars = () => {
    return `MINIO_ENDPOINT=${config.endpoint}
MINIO_PORT=${config.port}
MINIO_USE_SSL=${config.useSSL}
MINIO_ACCESS_KEY=${config.accessKey}
MINIO_SECRET_KEY=${config.secretKey}`;
  };

  const renderStepContent = () => {
    if (step >= steps.length) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold">Configuration Ready!</h3>
            <p className="text-sm text-gray-600">
              Your MinIO configuration is complete. Follow the steps below to apply these settings.
            </p>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              Environment variables must be set in your apiClient app settings. Copy the configuration below and add it to your secrets.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Configuration Summary</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generateEnvVars())}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy All
              </Button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-100 space-y-1">
              <div>MINIO_ENDPOINT=<span className="text-green-400">{config.endpoint}</span></div>
              <div>MINIO_PORT=<span className="text-green-400">{config.port}</span></div>
              <div>MINIO_USE_SSL=<span className="text-green-400">{config.useSSL.toString()}</span></div>
              <div>MINIO_ACCESS_KEY=<span className="text-green-400">{config.accessKey}</span></div>
              <div>MINIO_SECRET_KEY=<span className="text-green-400">{'*'.repeat(config.secretKey.length)}</span></div>
            </div>
          </div>

          <Alert className="bg-amber-50 border-amber-200">
            <Zap className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800 space-y-2">
              <p className="font-semibold">Next Steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-xs">
                <li>Go to your apiClient Dashboard → Settings → Environment Variables</li>
                <li>Add each environment variable shown above</li>
                <li>Save your changes</li>
                <li>Return to the Test Page to verify your connection</li>
              </ol>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false);
                setStep(0);
                toast({ 
                  title: "Configuration Saved", 
                  description: "Remember to set these values in your apiClient settings!" 
                });
              }}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </motion.div>
      );
    }

    const currentStep = steps[step];
    const Icon = currentStep.icon;

    return (
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <Icon className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold">{currentStep.title}</h3>
          <p className="text-sm text-gray-600">{currentStep.description}</p>
        </div>

        <div className="space-y-4">
          {currentStep.isSwitch ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Enable SSL/TLS</Label>
                <p className="text-xs text-gray-600">{currentStep.hint}</p>
              </div>
              <Switch
                checked={config.useSSL}
                onCheckedChange={(checked) => setConfig({ ...config, useSSL: checked })}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor={currentStep.field}>{currentStep.title}</Label>
              <Input
                id={currentStep.field}
                type={currentStep.isPassword ? 'password' : 'text'}
                value={config[currentStep.field]}
                onChange={(e) => {
                  setConfig({ ...config, [currentStep.field]: e.target.value });
                  setErrors({});
                }}
                placeholder={currentStep.placeholder}
                className={errors[currentStep.field] ? 'border-red-500' : ''}
              />
              {errors[currentStep.field] && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors[currentStep.field]}
                </p>
              )}
            </div>
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-xs text-blue-800">
              <p className="font-semibold mb-1">Tip:</p>
              <p>{currentStep.hint}</p>
            </AlertDescription>
          </Alert>

          {currentStep.examples && (
            <div className="space-y-2">
              <Label className="text-xs text-gray-500">Examples:</Label>
              <div className="flex flex-wrap gap-2">
                {currentStep.examples.map((example, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => setConfig({ ...config, [currentStep.field]: example })}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-purple-600" />
            MinIO Setup Wizard
          </DialogTitle>
          <DialogDescription>
            Step {Math.min(step + 1, steps.length + 1)} of {steps.length + 1}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <div className="flex items-center gap-2">
            {[...Array(steps.length + 1)].map((_, idx) => (
              <div key={idx} className="flex-1">
                <div className={`h-2 rounded-full transition-all ${
                  idx <= step ? 'bg-gradient-to-r from-purple-600 to-indigo-600' : 'bg-gray-200'
                }`} />
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
