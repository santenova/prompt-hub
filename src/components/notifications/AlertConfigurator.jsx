import React, { useState } from "react";
import { apiClient } from "@/apis/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Bell,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  TrendingUp,
  Activity,
  DollarSign
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

export default function AlertConfigurator({ userEmail, subscriptions }) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [alertName, setAlertName] = useState("");
  const [alertType, setAlertType] = useState("rate_limit");
  const [selectedSubscription, setSelectedSubscription] = useState("");
  const [threshold, setThreshold] = useState(80);
  const [channels, setChannels] = useState(["in_app"]);
  const [frequency, setFrequency] = useState("immediate");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alert-configurations', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      const allAlerts = await apiClient.entities.AlertConfiguration.list('-created_date');
      return allAlerts.filter(a => a.user_email === userEmail);
    },
    enabled: !!userEmail,
    initialData: [],
  });

  const createAlertMutation = useMutation({
    mutationFn: (data) => apiClient.entities.AlertConfiguration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-configurations']);
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Alert Created",
        description: "Your alert configuration has been created successfully.",
        duration: 5000,
      });
    },
    onError: (error) => {
      console.error("Failed to create alert:", error);
      toast({
        title: "Error",
        description: "Failed to create alert configuration.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const updateAlertMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.entities.AlertConfiguration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-configurations']);
      setShowCreateDialog(false);
      resetForm();
      toast({
        title: "Alert Updated",
        description: "Your alert configuration has been updated successfully.",
        duration: 5000,
      });
    },
    onError: (error) => {
      console.error("Failed to update alert:", error);
      toast({
        title: "Error",
        description: "Failed to update alert configuration.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (id) => apiClient.entities.AlertConfiguration.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-configurations']);
      toast({
        title: "Alert Deleted",
        description: "Alert configuration has been deleted.",
        duration: 5000,
      });
    },
    onError: (error) => {
      console.error("Failed to delete alert:", error);
      toast({
        title: "Error",
        description: "Failed to delete alert configuration.",
        variant: "destructive",
        duration: 5000,
      });
    }
  });

  const toggleAlertMutation = useMutation({
    mutationFn: ({ id, isEnabled }) => 
      apiClient.entities.AlertConfiguration.update(id, { is_enabled: isEnabled }),
    onSuccess: () => {
      queryClient.invalidateQueries(['alert-configurations']);
    },
  });

  const handleChannelToggle = (channel) => {
    setChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSave = () => {
    if (!alertName || !selectedSubscription) {
      toast({
        title: "Missing Information",
        description: "Please provide alert name and select a subscription.",
        variant: "destructive"
      });
      return;
    }

    const data = {
      user_email: userEmail,
      alert_name: alertName,
      alert_type: alertType,
      subscription_id: selectedSubscription,
      is_enabled: true,
      conditions: {
        threshold_percentage: threshold,
        comparison: "greater_than"
      },
      notification_channels: channels,
      notification_frequency: frequency,
      trigger_count: 0
    };

    if (editingAlert) {
      updateAlertMutation.mutate({ id: editingAlert.id, data });
    } else {
      createAlertMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setAlertName("");
    setAlertType("rate_limit");
    setSelectedSubscription("");
    setThreshold(80);
    setChannels(["in_app"]);
    setFrequency("immediate");
    setEditingAlert(null);
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setAlertName(alert.alert_name);
    setAlertType(alert.alert_type);
    setSelectedSubscription(alert.subscription_id);
    setThreshold(alert.conditions?.threshold_percentage || 80);
    setChannels(alert.notification_channels || ["in_app"]);
    setFrequency(alert.notification_frequency || "immediate");
    setShowCreateDialog(true);
  };

  const getAlertTypeIcon = (type) => {
    const icons = {
      rate_limit: <AlertTriangle className="w-5 h-5 text-orange-600" />,
      training_failure: <Activity className="w-5 h-5 text-red-600" />,
      low_usage: <TrendingUp className="w-5 h-5 text-blue-600" />,
      cost_threshold: <DollarSign className="w-5 h-5 text-green-600" />
    };
    return icons[type] || icons.rate_limit;
  };

  const alertTypes = [
    { value: "rate_limit", label: "Rate Limit Warning", desc: "Alert when approaching API rate limits" },
    { value: "training_failure", label: "Training Failure", desc: "Notify on training job failures" },
    { value: "low_usage", label: "Low Usage", desc: "Alert for underutilized subscriptions" },
    { value: "cost_threshold", label: "Cost Threshold", desc: "Notify when costs exceed threshold" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            Alert Configuration
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Configure custom alerts for your subscriptions</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowCreateDialog(true);
          }}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 w-full sm:w-auto"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center text-gray-500 px-4">
            <Bell className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm mb-2">No alerts configured</p>
            <p className="text-xs text-gray-500 mb-4">
              Set up alerts to stay informed about your subscriptions
            </p>
            <Button onClick={() => setShowCreateDialog(true)} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Alert
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="border-2">
              <CardContent className="pt-4 sm:pt-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex gap-3 flex-1 w-full">
                    <div className="flex-shrink-0">
                      {getAlertTypeIcon(alert.alert_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm sm:text-base">{alert.alert_name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {alert.alert_type.replace('_', ' ')}
                        </Badge>
                        {alert.is_enabled ? (
                          <Badge className="bg-green-600 text-xs">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Threshold: {alert.conditions?.threshold_percentage}%
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {alert.notification_channels?.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                      {alert.trigger_count > 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Triggered {alert.trigger_count} times
                          {alert.last_triggered && (
                            <> • Last: {new Date(alert.last_triggered).toLocaleDateString()}</>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Switch
                      checked={alert.is_enabled}
                      onCheckedChange={(checked) =>
                        toggleAlertMutation.mutate({ id: alert.id, isEnabled: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(alert)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteAlertMutation.mutate(alert.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:w-full sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {editingAlert ? 'Edit Alert' : 'Create Alert'}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Configure alert rules and notification preferences
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="alert-name" className="text-sm">Alert Name *</Label>
              <Input
                id="alert-name"
                placeholder="e.g., High API Usage Warning"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Alert Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                {alertTypes.map((type) => (
                  <div
                    key={type.value}
                    className={`p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      alertType === type.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setAlertType(type.value)}
                  >
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={alertType === type.value}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="font-semibold text-xs sm:text-sm">{type.label}</p>
                        <p className="text-xs text-gray-600">{type.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription" className="text-sm">Subscription *</Label>
              <Select value={selectedSubscription} onValueChange={setSelectedSubscription}>
                <SelectTrigger id="subscription" className="text-sm">
                  <SelectValue placeholder="Select subscription" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptions.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id} className="text-sm">
                      {sub.package_name || sub.package_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold" className="text-sm">Threshold Percentage</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="threshold"
                  type="number"
                  min="1"
                  max="100"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value))}
                  className="w-20 sm:w-24 text-sm"
                />
                <span className="text-sm text-gray-600">%</span>
              </div>
              <p className="text-xs text-gray-500">
                Alert when usage reaches this percentage
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Notification Channels</Label>
              <div className="space-y-2">
                {['in_app', 'email', 'webhook'].map((channel) => (
                  <div key={channel} className="flex items-center gap-2">
                    <Checkbox
                      checked={channels.includes(channel)}
                      onCheckedChange={() => handleChannelToggle(channel)}
                    />
                    <Label className="capitalize cursor-pointer text-sm">
                      {channel.replace('_', ' ')}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency" className="text-sm">Notification Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger id="frequency" className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate" className="text-sm">Immediate</SelectItem>
                  <SelectItem value="hourly" className="text-sm">Hourly</SelectItem>
                  <SelectItem value="daily" className="text-sm">Daily</SelectItem>
                  <SelectItem value="once" className="text-sm">Once (until resolved)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              className="w-full sm:w-auto"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={createAlertMutation.isPending || updateAlertMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 w-full sm:w-auto"
              size="sm"
            >
              {editingAlert ? 'Update Alert' : 'Create Alert'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
