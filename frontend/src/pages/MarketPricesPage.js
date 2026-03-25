import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import { getMarketPrices } from '../services/api';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MarketPricesPage = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await getMarketPrices();
      setPrices(response.data.prices);
      setLastUpdated(response.data.updated_at);
    } catch (error) {
      console.error('Failed to fetch market prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  const filteredPrices = prices.filter(item =>
    item.crop.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.market.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const chartData = prices.slice(0, 6).map(item => ({
    name: item.crop,
    price: item.price
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#2F5233]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="market-prices-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#1C1917]">Market Prices</h2>
          <p className="text-[#78716C]">Current crop prices from major markets</p>
        </div>
        <Button 
          variant="outline" 
          onClick={fetchPrices}
          className="border-[#2F5233] text-[#2F5233]"
          data-testid="refresh-prices-button"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Prices
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {prices.slice(0, 4).map((item, index) => (
          <Card key={index} className="bg-white border-[#E7E5E4]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#78716C]">{item.crop}</p>
                  <p className="text-2xl font-semibold text-[#1C1917]">₹{item.price.toLocaleString()}</p>
                  <p className="text-xs text-[#78716C]">{item.unit}</p>
                </div>
                <div className={`flex items-center ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.change >= 0 ? (
                    <ArrowUpRight className="w-5 h-5" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5" />
                  )}
                  <span className="font-medium">{Math.abs(item.change)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price Chart */}
      <Card className="bg-white border-[#E7E5E4]" data-testid="price-chart">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917] flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2F5233]" />
            Price Comparison (₹ per Quintal)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" />
                <XAxis dataKey="name" stroke="#78716C" fontSize={12} />
                <YAxis stroke="#78716C" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #E7E5E4',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Price']}
                />
                <Bar dataKey="price" fill="#2F5233" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Prices Table */}
      <Card className="bg-white border-[#E7E5E4]" data-testid="prices-table">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold text-[#1C1917]">All Market Prices</CardTitle>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
              <Input
                placeholder="Search crop or market..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="market-search-input"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border border-[#E7E5E4] rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#FAFAFA]">
                  <TableHead className="font-semibold text-[#1C1917]">Crop</TableHead>
                  <TableHead className="font-semibold text-[#1C1917]">Price</TableHead>
                  <TableHead className="font-semibold text-[#1C1917]">Unit</TableHead>
                  <TableHead className="font-semibold text-[#1C1917]">Change</TableHead>
                  <TableHead className="font-semibold text-[#1C1917]">Market</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPrices.map((item, index) => (
                  <TableRow key={index} className="hover:bg-[#FAFAFA]" data-testid={`price-row-${index}`}>
                    <TableCell className="font-medium text-[#1C1917]">{item.crop}</TableCell>
                    <TableCell className="text-[#1C1917]">₹{item.price.toLocaleString()}</TableCell>
                    <TableCell className="text-[#78716C]">{item.unit}</TableCell>
                    <TableCell>
                      <Badge className={item.change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                        <span className="flex items-center gap-1">
                          {item.change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {item.change >= 0 ? '+' : ''}{item.change}%
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#78716C]">{item.market}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {lastUpdated && (
            <p className="text-xs text-[#78716C] text-center mt-4">
              Last updated: {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Market Tips */}
      <Card className="bg-white border-[#E7E5E4]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917]">Market Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-800">High Demand</h4>
              </div>
              <p className="text-sm text-green-700">Cotton and Soybean showing strong upward trends this season.</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">Price Alert</h4>
              </div>
              <p className="text-sm text-yellow-700">Tomato prices may fluctuate due to seasonal changes.</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-800">Best Time to Sell</h4>
              </div>
              <p className="text-sm text-blue-700">Wheat prices typically peak in April-May. Plan accordingly.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketPricesPage;
