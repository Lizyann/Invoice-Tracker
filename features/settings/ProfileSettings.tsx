import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { Button, Input, TextArea, Card } from '../../components/ui';
import { Camera, Save, User as UserIcon, Loader2, Trash2, Globe, FileText, Phone, MapPin, Building } from 'lucide-react';
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
    website: user.website || '',
    taxId: user.taxId || '',
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
      // Optional: Show a toast here
    } catch (error: any) {
      alert('Failed to update profile: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleRemoveAvatar = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user.avatarUrl) return;
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    
    setIsUploading(true);
    try {
        const updatedUser = await updateUserProfile({ avatarUrl: '' });
        onUpdate(updatedUser);
    } catch (error: any) {
        alert('Failed to remove photo: ' + error.message);
    } finally {
        setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const publicUrl = await uploadAvatar(user.id, file);
      const updatedUser = await updateUserProfile({ avatarUrl: publicUrl });
      onUpdate(updatedUser);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-500">Manage your business profile and branding.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Basic Info */}
        <div className="space-y-6">
            <Card className="p-6 flex flex-col items-center text-center">
                <div className="relative group cursor-pointer mb-4" onClick={handleAvatarClick}>
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-indigo-50 ring-4 ring-white shadow-lg flex items-center justify-center relative">
                    {isUploading ? (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                        </div>
                    ) : null}
                    
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-4xl font-bold text-indigo-600">{user.name.charAt(0).toUpperCase()}</span>
                    )}
                    </div>
                    
                    <div className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity ${isUploading ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}>
                        <Camera className="h-8 w-8 text-white" />
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/jpeg,image/png,image/gif"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </div>
                
                {user.avatarUrl && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-2 mb-2" onClick={handleRemoveAvatar} disabled={isUploading}>
                        <Trash2 className="h-4 w-4 mr-2" /> Remove Photo
                    </Button>
                )}

                <h2 className="text-lg font-bold text-slate-900">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.email}</p>
            </Card>
        </div>

        {/* Right Column: Form Details */}
        <div className="lg:col-span-2">
            <Card className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                            <UserIcon className="h-5 w-5 mr-2 text-indigo-500" />
                            Personal Details
                        </h3>
                        <div className="grid grid-cols-1 gap-6">
                            <Input 
                                label="Full Name" 
                                name="name" 
                                value={formData.name} 
                                onChange={handleChange} 
                                required 
                            />
                            <Input 
                                label="Email Address" 
                                value={user.email} 
                                disabled 
                                className="bg-slate-50 text-slate-500 cursor-not-allowed" 
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100" />

                    {/* Business Information */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                            <Building className="h-5 w-5 mr-2 text-indigo-500" />
                            Business Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                             <div className="col-span-1 md:col-span-2">
                                <Input 
                                    label="Company Name" 
                                    name="companyName" 
                                    value={formData.companyName} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Acme Inc."
                                />
                             </div>
                            <Input 
                                label="Phone Number" 
                                name="phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                                placeholder="+1 (555) 000-0000"
                            />
                             <Input 
                                label="Website" 
                                name="website" 
                                value={formData.website} 
                                onChange={handleChange} 
                                placeholder="https://example.com"
                            />
                            <div className="col-span-1 md:col-span-2">
                                <Input 
                                    label="Tax ID / VAT Number" 
                                    name="taxId" 
                                    value={formData.taxId} 
                                    onChange={handleChange} 
                                    placeholder="e.g. US-123456789"
                                />
                            </div>
                        </div>
                        
                        <TextArea 
                            label="Business Address" 
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange} 
                            placeholder="123 Business Rd, Suite 100, City, ST 12345"
                            rows={3}
                        />
                    </div>

                    <div className="pt-4 flex justify-end">
                        <Button type="submit" isLoading={isSaving} disabled={isUploading} className="w-full md:w-auto px-8 shadow-lg shadow-indigo-200">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
      </div>
    </div>
  );
};