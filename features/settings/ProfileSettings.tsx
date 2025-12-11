import React, { useState, useRef, useEffect } from 'react';
import { User } from '../../types';
import { Button, Input, TextArea, Card } from '../../components/ui';
import { Camera, Save, User as UserIcon, Loader2, Trash2, Building, Moon, Sun } from 'lucide-react';
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize theme state from DOM
  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  // Clean up preview URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
    };
  }, [previewUrl]);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains('dark')) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
        setIsDarkMode(false);
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
        setIsDarkMode(true);
    }
  };

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
        setPreviewUrl(null);
    } catch (error: any) {
        alert('Failed to remove photo: ' + error.message);
    } finally {
        setIsUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // Increased to 5MB
      alert("Image size should be less than 5MB");
      return;
    }

    // Create immediate preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      const publicUrl = await uploadAvatar(user.id, file);
      const updatedUser = await updateUserProfile({ avatarUrl: publicUrl });
      onUpdate(updatedUser);
      setPreviewUrl(null); 
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to upload image.');
      setPreviewUrl(null); // Revert if failed
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Determine what to show: Preview (during upload) -> User Avatar (remote) -> Initials
  const displayUrl = previewUrl || user.avatarUrl;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your business profile and branding.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Appearance */}
        <div className="space-y-6">
            <Card className="p-6 flex flex-col items-center text-center">
                <div className="relative group cursor-pointer mb-4" onClick={handleAvatarClick}>
                    <div className="h-32 w-32 rounded-full overflow-hidden bg-indigo-50 dark:bg-indigo-900/30 ring-4 ring-white dark:ring-slate-700 shadow-lg flex items-center justify-center relative">
                    {isUploading && (
                        <div className="absolute inset-0 bg-white/50 dark:bg-black/50 flex items-center justify-center z-20 backdrop-blur-sm">
                            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                        </div>
                    )}
                    
                    {displayUrl ? (
                        <img 
                            src={displayUrl} 
                            alt="Profile" 
                            className="h-full w-full object-cover" 
                            key={displayUrl} // Force re-render on URL change
                        />
                    ) : (
                        <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 select-none">
                            {user.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                    </div>
                    
                    <div className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center transition-opacity ${isUploading ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} z-10`}>
                        <Camera className="h-8 w-8 text-white" />
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={handleFileChange}
                        disabled={isUploading}
                    />
                </div>
                
                {displayUrl && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 -mt-2 mb-2" 
                        onClick={handleRemoveAvatar} 
                        disabled={isUploading}
                        type="button"
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> Remove Photo
                    </Button>
                )}

                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user.name}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center">
                    <Moon className="h-5 w-5 mr-2 text-indigo-500" />
                    Appearance
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-slate-900 dark:text-white">Dark Mode</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Toggle app theme</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-slate-800 ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-200'}`}
                        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                         <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                         <span className="sr-only">Toggle dark mode</span>
                    </button>
                </div>
            </Card>
        </div>

        {/* Right Column: Form Details */}
        <div className="lg:col-span-2">
            <Card className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center">
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
                                className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-500 cursor-not-allowed" 
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-700" />

                    {/* Business Information */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4 flex items-center">
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
                        <Button type="submit" isLoading={isSaving} disabled={isUploading} className="w-full md:w-auto px-8 shadow-lg shadow-indigo-200 dark:shadow-none">
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