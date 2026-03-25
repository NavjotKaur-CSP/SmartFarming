import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  User, 
  Mail,
  Phone,
  MapPin,
  Home,
  Globe,
  Save,
  Loader2,
  CheckCircle2
} from 'lucide-react';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    farm_name: user?.farm_name || '',
    location: user?.location || '',
    language: user?.language || 'en'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
      await updateProfile(formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto" data-testid="profile-page">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-[#1C1917]">Profile Settings</h2>
        <p className="text-[#78716C]">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-white border-[#E7E5E4]">
        <CardHeader className="border-b border-[#E7E5E4]">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="https://images.pexels.com/photos/2519332/pexels-photo-2519332.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940" />
              <AvatarFallback className="bg-[#2F5233] text-white text-2xl">
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl font-semibold text-[#1C1917]">{user?.name}</CardTitle>
              <p className="text-[#78716C]">{user?.email}</p>
              <p className="text-sm text-[#D97736] capitalize">{user?.role || 'Farmer'}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700" data-testid="profile-success">
                <CheckCircle2 className="w-5 h-5" />
                Profile updated successfully!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2 text-[#44403C]">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="border-[#E7E5E4] focus:border-[#2F5233] focus:ring-[#2F5233]"
                  data-testid="profile-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-[#44403C]">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="border-[#E7E5E4] bg-[#FAFAFA] text-[#78716C]"
                />
                <p className="text-xs text-[#78716C]">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-[#44403C]">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="border-[#E7E5E4] focus:border-[#2F5233] focus:ring-[#2F5233]"
                  data-testid="profile-phone-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="farm_name" className="flex items-center gap-2 text-[#44403C]">
                  <Home className="w-4 h-4" />
                  Farm Name
                </Label>
                <Input
                  id="farm_name"
                  name="farm_name"
                  value={formData.farm_name}
                  onChange={handleChange}
                  placeholder="Your farm name"
                  className="border-[#E7E5E4] focus:border-[#2F5233] focus:ring-[#2F5233]"
                  data-testid="profile-farm-name-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2 text-[#44403C]">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Your location"
                  className="border-[#E7E5E4] focus:border-[#2F5233] focus:ring-[#2F5233]"
                  data-testid="profile-location-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="flex items-center gap-2 text-[#44403C]">
                  <Globe className="w-4 h-4" />
                  Language
                </Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger data-testid="profile-language-select">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                    <SelectItem value="pa">Punjabi</SelectItem>
                    <SelectItem value="mr">Marathi</SelectItem>
                    <SelectItem value="gu">Gujarati</SelectItem>
                    <SelectItem value="ta">Tamil</SelectItem>
                    <SelectItem value="te">Telugu</SelectItem>
                    <SelectItem value="kn">Kannada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#E7E5E4]">
              <Button 
                type="submit" 
                className="bg-[#2F5233] hover:bg-[#243E26]"
                disabled={loading}
                data-testid="profile-save-button"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card className="bg-white border-[#E7E5E4]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#1C1917]">Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#E7E5E4]">
              <div>
                <p className="font-medium text-[#1C1917]">Account Type</p>
                <p className="text-sm text-[#78716C]">Your subscription plan</p>
              </div>
              <span className="px-3 py-1 bg-[#2F5233]/10 text-[#2F5233] rounded-full text-sm font-medium capitalize">
                {user?.role || 'Farmer'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#E7E5E4]">
              <div>
                <p className="font-medium text-[#1C1917]">Member Since</p>
                <p className="text-sm text-[#78716C]">Account creation date</p>
              </div>
              <span className="text-[#44403C]">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-[#1C1917]">Account ID</p>
                <p className="text-sm text-[#78716C]">Your unique identifier</p>
              </div>
              <span className="text-[#78716C] font-mono text-sm">
                {user?.id?.slice(0, 8) || 'N/A'}...
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
