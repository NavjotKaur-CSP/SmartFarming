import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { 
  Sprout, 
  Plus, 
  Calendar,
  MapPin,
  Trash2,
  Edit,
  Leaf,
  Search
} from 'lucide-react';
import { getCrops, createCrop, updateCrop, deleteCrop } from '../services/api';
import { format } from 'date-fns';

const CropsPage = () => {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    planted_date: '',
    expected_harvest_date: '',
    field_area: '',
    location: '',
    notes: ''
  });

  const fetchCrops = async () => {
    try {
      const response = await getCrops();
      setCrops(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch crops:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrops();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        field_area: parseFloat(formData.field_area),
        planted_date: new Date(formData.planted_date).toISOString(),
        expected_harvest_date: formData.expected_harvest_date ? new Date(formData.expected_harvest_date).toISOString() : null
      };
      
      if (editingCrop) {
        await updateCrop(editingCrop.id, data);
      } else {
        await createCrop(data);
      }
      
      setDialogOpen(false);
      setEditingCrop(null);
      setFormData({
        name: '',
        variety: '',
        planted_date: '',
        expected_harvest_date: '',
        field_area: '',
        location: '',
        notes: ''
      });
      fetchCrops();
    } catch (error) {
      console.error('Failed to save crop:', error);
    }
  };

  const handleEdit = (crop) => {
    setEditingCrop(crop);
    setFormData({
      name: crop.name,
      variety: crop.variety || '',
      planted_date: crop.planted_date ? format(new Date(crop.planted_date), 'yyyy-MM-dd') : '',
      expected_harvest_date: crop.expected_harvest_date ? format(new Date(crop.expected_harvest_date), 'yyyy-MM-dd') : '',
      field_area: crop.field_area.toString(),
      location: crop.location || '',
      notes: crop.notes || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (cropId) => {
    if (window.confirm('Are you sure you want to delete this crop?')) {
      try {
        await deleteCrop(cropId);
        fetchCrops();
      } catch (error) {
        console.error('Failed to delete crop:', error);
      }
    }
  };

  const filteredCrops = crops.filter(crop => 
    crop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (crop.variety && crop.variety.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getHealthBadgeClass = (status) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-700';
      case 'at_risk': return 'bg-yellow-100 text-yellow-700';
      case 'critical': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2F5233]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="crops-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#1C1917]">My Crops</h2>
          <p className="text-[#78716C]">Manage and monitor all your crops</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-[#2F5233] hover:bg-[#243E26]"
              onClick={() => {
                setEditingCrop(null);
                setFormData({
                  name: '',
                  variety: '',
                  planted_date: '',
                  expected_harvest_date: '',
                  field_area: '',
                  location: '',
                  notes: ''
                });
              }}
              data-testid="add-crop-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Crop
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCrop ? 'Edit Crop' : 'Add New Crop'}</DialogTitle>
              <DialogDescription>
                {editingCrop ? 'Update your crop details below.' : 'Enter your crop details to add it to your farm.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Crop Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Wheat"
                    required
                    data-testid="crop-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variety">Variety</Label>
                  <Input
                    id="variety"
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="e.g., HD-2967"
                    data-testid="crop-variety-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planted_date">Planted Date *</Label>
                  <Input
                    id="planted_date"
                    type="date"
                    value={formData.planted_date}
                    onChange={(e) => setFormData({ ...formData, planted_date: e.target.value })}
                    required
                    data-testid="crop-planted-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_harvest_date">Expected Harvest</Label>
                  <Input
                    id="expected_harvest_date"
                    type="date"
                    value={formData.expected_harvest_date}
                    onChange={(e) => setFormData({ ...formData, expected_harvest_date: e.target.value })}
                    data-testid="crop-harvest-date-input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field_area">Field Area (acres) *</Label>
                  <Input
                    id="field_area"
                    type="number"
                    step="0.1"
                    value={formData.field_area}
                    onChange={(e) => setFormData({ ...formData, field_area: e.target.value })}
                    placeholder="e.g., 5.5"
                    required
                    data-testid="crop-area-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., North Field"
                    data-testid="crop-location-input"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional notes..."
                  rows={3}
                  data-testid="crop-notes-input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#2F5233] hover:bg-[#243E26]" data-testid="crop-submit-button">
                  {editingCrop ? 'Update Crop' : 'Add Crop'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
        <Input
          placeholder="Search crops..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="crop-search-input"
        />
      </div>

      {/* Crops Grid */}
      {filteredCrops.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCrops.map((crop) => (
            <Card key={crop.id} className="bg-white border-[#E7E5E4] card-hover" data-testid={`crop-card-${crop.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#2F5233]/10 rounded-xl flex items-center justify-center">
                      <Leaf className="w-6 h-6 text-[#2F5233]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-[#1C1917]">{crop.name}</CardTitle>
                      {crop.variety && <p className="text-sm text-[#78716C]">{crop.variety}</p>}
                    </div>
                  </div>
                  <Badge className={getHealthBadgeClass(crop.health_status)}>
                    {crop.health_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[#44403C]">
                    <Sprout className="w-4 h-4 text-[#78716C]" />
                    <span>{crop.field_area} acres</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#44403C]">
                    <Calendar className="w-4 h-4 text-[#78716C]" />
                    <span>Planted: {format(new Date(crop.planted_date), 'MMM dd, yyyy')}</span>
                  </div>
                  {crop.location && (
                    <div className="flex items-center gap-2 text-sm text-[#44403C]">
                      <MapPin className="w-4 h-4 text-[#78716C]" />
                      <span>{crop.location}</span>
                    </div>
                  )}
                  {crop.expected_harvest_date && (
                    <div className="flex items-center gap-2 text-sm text-[#D97736]">
                      <Calendar className="w-4 h-4" />
                      <span>Harvest: {format(new Date(crop.expected_harvest_date), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-[#E7E5E4]">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-[#E7E5E4]"
                    onClick={() => handleEdit(crop)}
                    data-testid={`edit-crop-${crop.id}`}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => handleDelete(crop.id)}
                    data-testid={`delete-crop-${crop.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white border-[#E7E5E4]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sprout className="w-16 h-16 text-[#78716C] opacity-50 mb-4" />
            <h3 className="text-lg font-medium text-[#1C1917] mb-2">No crops found</h3>
            <p className="text-[#78716C] text-center mb-4">
              {searchTerm ? 'Try a different search term' : 'Start by adding your first crop'}
            </p>
            {!searchTerm && (
              <Button 
                className="bg-[#2F5233] hover:bg-[#243E26]"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Crop
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CropsPage;
