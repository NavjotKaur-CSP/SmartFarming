import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  Bell, 
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  Check,
  Loader2
} from 'lucide-react';
import { getAlerts, markAlertRead, deleteAlert } from '../services/api';

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchAlerts = async () => {
    try {
      const response = await getAlerts();
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleMarkRead = async (alertId) => {
    try {
      await markAlertRead(alertId);
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const handleDelete = async (alertId) => {
    try {
      await deleteAlert(alertId);
      setAlerts(alerts.filter(a => a.id !== alertId));
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const handleMarkAllRead = async () => {
    const unreadAlerts = alerts.filter(a => !a.is_read);
    for (const alert of unreadAlerts) {
      await markAlertRead(alert.id);
    }
    setAlerts(alerts.map(a => ({ ...a, is_read: true })));
  };

  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'danger': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'danger': return 'bg-red-100 text-red-700';
      case 'warning': return 'bg-yellow-100 text-yellow-700';
      case 'info': return 'bg-blue-100 text-blue-700';
      default: return 'bg-green-100 text-green-700';
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'weather': return 'bg-[#0EA5E9]/10 text-[#0EA5E9]';
      case 'crop_risk': return 'bg-[#D97736]/10 text-[#D97736]';
      case 'advisory': return 'bg-[#2F5233]/10 text-[#2F5233]';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !alert.is_read;
    return alert.alert_type === filter;
  });

  const unreadCount = alerts.filter(a => !a.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#2F5233]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="alerts-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#1C1917]">Alerts & Notifications</h2>
          <p className="text-[#78716C]">Stay informed about your farm's important updates</p>
        </div>
        {unreadCount > 0 && (
          <Button 
            variant="outline"
            onClick={handleMarkAllRead}
            className="border-[#2F5233] text-[#2F5233]"
            data-testid="mark-all-read-button"
          >
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All', count: alerts.length },
          { key: 'unread', label: 'Unread', count: unreadCount },
          { key: 'weather', label: 'Weather', count: alerts.filter(a => a.alert_type === 'weather').length },
          { key: 'crop_risk', label: 'Crop Risk', count: alerts.filter(a => a.alert_type === 'crop_risk').length },
          { key: 'advisory', label: 'Advisory', count: alerts.filter(a => a.alert_type === 'advisory').length },
        ].map(({ key, label, count }) => (
          <Button
            key={key}
            variant={filter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(key)}
            className={filter === key ? 'bg-[#2F5233] hover:bg-[#243E26]' : 'border-[#E7E5E4]'}
            data-testid={`filter-${key}`}
          >
            {label}
            {count > 0 && (
              <Badge className={`ml-2 ${filter === key ? 'bg-white text-[#2F5233]' : 'bg-[#E7E5E4] text-[#44403C]'}`}>
                {count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Alerts List */}
      <Card className="bg-white border-[#E7E5E4]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#D97736]" />
            {filter === 'all' ? 'All Alerts' : filter === 'unread' ? 'Unread Alerts' : `${filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')} Alerts`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`p-4 rounded-lg border transition-all ${
                    alert.is_read 
                      ? 'bg-white border-[#E7E5E4]' 
                      : 'bg-[#FEF3C7] border-[#FCD34D]'
                  }`}
                  data-testid={`alert-${alert.id}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {getAlertIcon(alert.severity)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-medium text-[#1C1917]">{alert.title}</h4>
                          <p className="text-sm text-[#44403C] mt-1">{alert.message}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={getTypeBadge(alert.alert_type)}>
                            {alert.alert_type.replace('_', ' ')}
                          </Badge>
                          <Badge className={getSeverityBadge(alert.severity)}>
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-[#78716C]">
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                        <div className="flex items-center gap-2">
                          {!alert.is_read && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleMarkRead(alert.id)}
                              className="text-[#2F5233] hover:text-[#243E26] hover:bg-[#2F5233]/10"
                              data-testid={`mark-read-${alert.id}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Mark Read
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(alert.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-alert-${alert.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 mx-auto text-[#78716C] opacity-50 mb-4" />
              <h3 className="text-lg font-medium text-[#1C1917] mb-2">No Alerts</h3>
              <p className="text-[#78716C]">
                {filter === 'all' 
                  ? "You're all caught up! No alerts at the moment."
                  : `No ${filter === 'unread' ? 'unread' : filter.replace('_', ' ')} alerts.`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Types Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-[#E7E5E4]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0EA5E9]/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#0EA5E9]" />
              </div>
              <div>
                <h4 className="font-medium text-[#1C1917]">Weather Alerts</h4>
                <p className="text-sm text-[#78716C]">Extreme weather conditions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E7E5E4]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#D97736]/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-[#D97736]" />
              </div>
              <div>
                <h4 className="font-medium text-[#1C1917]">Crop Risk Alerts</h4>
                <p className="text-sm text-[#78716C]">Potential threats to crops</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-[#E7E5E4]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2F5233]/10 rounded-lg flex items-center justify-center">
                <Info className="w-5 h-5 text-[#2F5233]" />
              </div>
              <div>
                <h4 className="font-medium text-[#1C1917]">Advisory Alerts</h4>
                <p className="text-sm text-[#78716C]">Farming tips & advisories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AlertsPage;
