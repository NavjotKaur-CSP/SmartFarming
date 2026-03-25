import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Sprout, 
  CloudSun, 
  TrendingUp, 
  Bell, 
  Activity,
  Droplets,
  ThermometerSun,
  Wind,
  ArrowRight,
  Leaf,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { getDashboardStats, getWeather, getCrops, getAlerts } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [weather, setWeather] = useState(null);
  const [crops, setCrops] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, weatherRes, cropsRes, alertsRes] = await Promise.all([
          getDashboardStats(),
          getWeather(),
          getCrops(),
          getAlerts()
        ]);
        setStats(statsRes.data);
        setWeather(weatherRes.data);
        setCrops(cropsRes.data);
        setAlerts(alertsRes.data.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const healthColors = {
    healthy: '#22C55E',
    at_risk: '#F59E0B',
    critical: '#EF4444'
  };

  const pieData = stats?.health_distribution ? [
    { name: 'Healthy', value: stats.health_distribution.healthy, color: healthColors.healthy },
    { name: 'At Risk', value: stats.health_distribution.at_risk, color: healthColors.at_risk },
    { name: 'Critical', value: stats.health_distribution.critical, color: healthColors.critical },
  ].filter(d => d.value > 0) : [];

  const yieldData = [
    { month: 'Jan', yield: 65 },
    { month: 'Feb', yield: 72 },
    { month: 'Mar', yield: 80 },
    { month: 'Apr', yield: 75 },
    { month: 'May', yield: 88 },
    { month: 'Jun', yield: 92 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F5233]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="dashboard-home">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-[#E7E5E4] card-hover animate-fade-in-up" data-testid="stat-total-crops">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#78716C] font-medium">Total Crops</p>
                <p className="text-3xl font-semibold text-[#1C1917] mt-1">{stats?.total_crops || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#2F5233]/10 rounded-xl flex items-center justify-center">
                <Sprout className="w-6 h-6 text-[#2F5233]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E7E5E4] card-hover animate-fade-in-up animation-delay-100" data-testid="stat-field-area">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#78716C] font-medium">Field Area</p>
                <p className="text-3xl font-semibold text-[#1C1917] mt-1">{stats?.total_field_area || 0} <span className="text-lg text-[#78716C]">acres</span></p>
              </div>
              <div className="w-12 h-12 bg-[#D97736]/10 rounded-xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-[#D97736]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E7E5E4] card-hover animate-fade-in-up animation-delay-200" data-testid="stat-predictions">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#78716C] font-medium">Predictions Made</p>
                <p className="text-3xl font-semibold text-[#1C1917] mt-1">{stats?.predictions_made || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#0EA5E9]/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#0EA5E9]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[#E7E5E4] card-hover animate-fade-in-up animation-delay-300" data-testid="stat-alerts">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#78716C] font-medium">Unread Alerts</p>
                <p className="text-3xl font-semibold text-[#1C1917] mt-1">{stats?.unread_alerts || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#F59E0B]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weather Widget */}
        <Card className="bg-white border-[#E7E5E4] lg:col-span-1" data-testid="weather-widget">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <CloudSun className="w-5 h-5 text-[#D97736]" />
              Weather Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weather ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl font-semibold text-[#1C1917]">{weather.temperature}°C</p>
                    <p className="text-[#78716C]">{weather.condition}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[#78716C]">{weather.location || 'Your Location'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#E7E5E4]">
                  <div className="text-center">
                    <Droplets className="w-5 h-5 mx-auto text-[#0EA5E9]" />
                    <p className="text-sm font-medium text-[#1C1917] mt-1">{weather.humidity}%</p>
                    <p className="text-xs text-[#78716C]">Humidity</p>
                  </div>
                  <div className="text-center">
                    <Wind className="w-5 h-5 mx-auto text-[#78716C]" />
                    <p className="text-sm font-medium text-[#1C1917] mt-1">{weather.wind_speed} km/h</p>
                    <p className="text-xs text-[#78716C]">Wind</p>
                  </div>
                  <div className="text-center">
                    <ThermometerSun className="w-5 h-5 mx-auto text-[#D97736]" />
                    <p className="text-sm font-medium text-[#1C1917] mt-1">{weather.uv_index}</p>
                    <p className="text-xs text-[#78716C]">UV Index</p>
                  </div>
                </div>
                <Link to="/dashboard/weather">
                  <Button variant="outline" className="w-full border-[#2F5233] text-[#2F5233] hover:bg-[#2F5233]/10">
                    View Full Forecast
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-[#78716C]">Loading weather data...</p>
            )}
          </CardContent>
        </Card>

        {/* Yield Trend Chart */}
        <Card className="bg-white border-[#E7E5E4] lg:col-span-2" data-testid="yield-chart">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2F5233]" />
                Yield Trend
              </CardTitle>
              <Link to="/dashboard/yield">
                <Button variant="ghost" size="sm" className="text-[#2F5233] hover:text-[#243E26]">
                  View Details <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yieldData}>
                  <defs>
                    <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2F5233" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2F5233" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                  <XAxis dataKey="month" stroke="#78716C" fontSize={12} />
                  <YAxis stroke="#78716C" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #E7E5E4',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="yield" 
                    stroke="#2F5233" 
                    strokeWidth={2}
                    fill="url(#yieldGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Crop Health Distribution */}
        <Card className="bg-white border-[#E7E5E4]" data-testid="health-distribution">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#22C55E]" />
              Crop Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="flex items-center justify-center">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 ml-4">
                  {pieData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-[#44403C]">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-[#78716C]">
                <Sprout className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No crops added yet</p>
                <Link to="/dashboard/crops">
                  <Button className="mt-4 bg-[#2F5233] hover:bg-[#243E26]">Add Your First Crop</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Crops */}
        <Card className="bg-white border-[#E7E5E4]" data-testid="recent-crops">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
                <Sprout className="w-5 h-5 text-[#2F5233]" />
                Recent Crops
              </CardTitle>
              <Link to="/dashboard/crops">
                <Button variant="ghost" size="sm" className="text-[#2F5233] hover:text-[#243E26]">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {crops.length > 0 ? (
              <div className="space-y-3">
                {crops.slice(0, 4).map((crop) => (
                  <div key={crop.id} className="flex items-center justify-between p-3 bg-[#FAFAFA] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2F5233]/10 rounded-lg flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-[#2F5233]" />
                      </div>
                      <div>
                        <p className="font-medium text-[#1C1917]">{crop.name}</p>
                        <p className="text-xs text-[#78716C]">{crop.field_area} acres</p>
                      </div>
                    </div>
                    <Badge 
                      className={
                        crop.health_status === 'healthy' ? 'bg-green-100 text-green-700' :
                        crop.health_status === 'at_risk' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }
                    >
                      {crop.health_status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#78716C]">
                <Sprout className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No crops yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card className="bg-white border-[#E7E5E4]" data-testid="recent-alerts">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#F59E0B]" />
                Recent Alerts
              </CardTitle>
              <Link to="/dashboard/alerts">
                <Button variant="ghost" size="sm" className="text-[#2F5233] hover:text-[#243E26]">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${alert.is_read ? 'bg-[#FAFAFA]' : 'bg-[#FEF3C7]'}`}>
                    {alert.severity === 'danger' ? (
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    ) : alert.severity === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-[#1C1917] truncate">{alert.title}</p>
                      <p className="text-xs text-[#78716C] truncate">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#78716C]">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardHome;
