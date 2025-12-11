import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { Button, Input, TextArea, Card } from '../../components/ui';
import { Camera, Save, User as UserIcon, Loader2 } from 'lucide-react';
import { uploadAvatar, updateUserProfile } from '../../services/storage';

interface ProfileSettingsProps {
  user: User;
  onUpdate: (user: User) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    companyName: user.companyName || '',
    phone: user.phone || '',
    address: user.address || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updatedUser = await updateUserProfile(formData);
      onUpdate(updatedUser);
      alert('Profile updated successfully!');
    } catch (error: any) {
      alert('Failed to update profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadAvatar(user.id, file);
      const updatedUser = await updateUserProfile({ ...formData, avatarUrl: publicUrl });
      onUpdate(updatedUser);
    } catch (error: any) {
      console.error(error);
      alert('Failed to upload image. Ensure you have an "avatars" bucket in Supabase with public access.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-500">Manage your personal information and preferences.</p>
      </div>

      <Card className="p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="h-24 w-24 rounded-full overflow-hidden bg-indigo-100 ring-4 ring-white shadow-lg flex items-center justify-center">
              {isUploading ? (
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              ) : user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-6 w-6 text-white" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileChange}
            />
          </div>
          <p className="mt-3 text-sm text-slate-500">Click to upload new photo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Full Name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
            />
            <Input 
              label="Company Name" 
              name="companyName" 
              value={formData.companyName} 
              onChange={handleChange} 
              placeholder="e.g. Acme Inc."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Email Address" 
              value={user.email} 
              disabled 
              className="bg-slate-50 text-slate-500" 
            />
            <Input 
              label="Phone Number" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <TextArea 
            label="Business Address" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
            placeholder="123 Business Rd, Suite 100, City, ST 12345"
            rows={3}
          />

          <div className="pt-4 flex justify-end">
            <Button type="submit" isLoading={isSaving} className="w-full md:w-auto px-8">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};