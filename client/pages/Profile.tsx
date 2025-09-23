import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Camera, 
  Settings, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Link,
  Crown,
  Calendar,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Save,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";
import { Link as RouterLink, useNavigate, Navigate } from "react-router-dom";
import { useUser, PresenceStatus } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const { user, presence, updateProfile, uploadAvatar, setPresenceStatus, logout } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Form states
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    displayName: user?.displayName || "",
    bio: user?.bio || "",
    location: user?.location || "",
    timezone: user?.timezone || "",
    professionalHeadline: user?.professionalHeadline || "",
    phoneNumber: user?.phoneNumber || "",
    company: user?.company || "",
    jobTitle: user?.jobTitle || "",
    socialLinks: {
      linkedin: user?.socialLinks?.linkedin || "",
      twitter: user?.socialLinks?.twitter || "",
      github: user?.socialLinks?.github || "",
      website: user?.socialLinks?.website || ""
    }
  });

  const [preferences, setPreferences] = useState({
    notifications: user?.preferences?.notifications || {
      email: true,
      push: true,
      mentions: true,
      calls: true
    },
    privacy: user?.preferences?.privacy || {
      showOnlineStatus: true,
      showLastSeen: true,
      allowDirectMessages: true
    },
    appearance: user?.preferences?.appearance || {
      theme: 'system' as 'light' | 'dark' | 'system',
      language: 'en'
    }
  });

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile({
        ...profileData,
        preferences: {
          ...user.preferences,
          ...preferences
        }
      });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please choose an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadAvatar(file);
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (status: PresenceStatus) => {
    try {
      await setPresenceStatus(status);
      toast({
        title: "Status Updated",
        description: `Your status has been set to ${status}.`,
      });
    } catch (error) {
      toast({
        title: "Status Update Failed",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: PresenceStatus) => {
    switch (status) {
      case "online": return "bg-success";
      case "away": return "bg-warning";
      case "busy": return "bg-destructive";
      case "dnd": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getSubscriptionBadgeColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'bg-brand-500 text-white';
      case 'business': return 'bg-yellow-500 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <RouterLink to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">OmniTalk</span>
              </RouterLink>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-lg font-semibold text-foreground">Profile Settings</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button variant="outline" asChild>
                <RouterLink to="/dashboard">Back to Dashboard</RouterLink>
              </Button>
              <Button onClick={handleLogout} variant="ghost">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="privacy">
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Profile Picture & Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Picture & Status</CardTitle>
                  <CardDescription>Manage your avatar and online presence</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                        {user.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-medium text-muted-foreground">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${getStatusColor(presence?.status || 'offline')} rounded-full border-2 border-background`}></div>
                    </div>
                    
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Change Avatar
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Status</Label>
                    <Select
                      value={presence?.status || 'offline'}
                      onValueChange={(value) => handleStatusChange(value as PresenceStatus)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">🟢 Online</SelectItem>
                        <SelectItem value="away">🟡 Away</SelectItem>
                        <SelectItem value="busy">🔴 Busy</SelectItem>
                        <SelectItem value="dnd">⛔ Do Not Disturb</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Subscription</Label>
                    <div className="flex items-center justify-between">
                      <Badge className={getSubscriptionBadgeColor(user.subscription?.tier || 'free')}>
                        <Crown className="w-3 h-3 mr-1" />
                        {user.subscription?.tier.toUpperCase() || 'FREE'}
                      </Badge>
                      {user.subscription?.tier === 'free' && (
                        <Button size="sm" variant="outline">
                          Upgrade
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayName">Display Name</Label>
                      <Input
                        id="displayName"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                        className="opacity-50"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell others about yourself..."
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                    <CardDescription>Your work and professional details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="headline">Professional Headline</Label>
                      <Input
                        id="headline"
                        placeholder="e.g. Senior Software Engineer at TechCorp"
                        value={profileData.professionalHeadline}
                        onChange={(e) => setProfileData({...profileData, professionalHeadline: e.target.value})}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={profileData.company}
                          onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={profileData.jobTitle}
                          onChange={(e) => setProfileData({...profileData, jobTitle: e.target.value})}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact & Location</CardTitle>
                    <CardDescription>Where to find you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="location"
                            placeholder="e.g. San Francisco, CA"
                            value={profileData.location}
                            onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={profileData.timezone}
                          onValueChange={(value) => setProfileData({...profileData, timezone: value})}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="America/New_York">Eastern Time</SelectItem>
                            <SelectItem value="America/Chicago">Central Time</SelectItem>
                            <SelectItem value="America/Denver">Mountain Time</SelectItem>
                            <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                            <SelectItem value="Europe/London">London</SelectItem>
                            <SelectItem value="Europe/Paris">Paris</SelectItem>
                            <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+1 (555) 123-4567"
                          value={profileData.phoneNumber}
                          onChange={(e) => setProfileData({...profileData, phoneNumber: e.target.value})}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Social Links</CardTitle>
                    <CardDescription>Connect your social profiles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="linkedin">LinkedIn</Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="linkedin"
                          placeholder="https://linkedin.com/in/username"
                          value={profileData.socialLinks.linkedin}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            socialLinks: {...profileData.socialLinks, linkedin: e.target.value}
                          })}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter</Label>
                        <Input
                          id="twitter"
                          placeholder="@username"
                          value={profileData.socialLinks.twitter}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            socialLinks: {...profileData.socialLinks, twitter: e.target.value}
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          placeholder="github.com/username"
                          value={profileData.socialLinks.github}
                          onChange={(e) => setProfileData({
                            ...profileData,
                            socialLinks: {...profileData.socialLinks, github: e.target.value}
                          })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.com"
                        value={profileData.socialLinks.website}
                        onChange={(e) => setProfileData({
                          ...profileData,
                          socialLinks: {...profileData.socialLinks, website: e.target.value}
                        })}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Control how and when you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.email}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences,
                          notifications: {...preferences.notifications, email: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get push notifications on your devices</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.push}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences,
                          notifications: {...preferences.notifications, push: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Mentions & Replies</Label>
                      <p className="text-sm text-muted-foreground">When someone mentions you or replies to your message</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.mentions}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences,
                          notifications: {...preferences.notifications, mentions: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Incoming Calls</Label>
                      <p className="text-sm text-muted-foreground">Notifications for incoming video and voice calls</p>
                    </div>
                    <Switch
                      checked={preferences.notifications.calls}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences,
                          notifications: {...preferences.notifications, calls: checked}
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
                <CardDescription>Control who can see your information and contact you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Online Status</Label>
                      <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                    </div>
                    <Switch
                      checked={preferences.privacy.showOnlineStatus}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences,
                          privacy: {...preferences.privacy, showOnlineStatus: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Last Seen</Label>
                      <p className="text-sm text-muted-foreground">Display when you were last active</p>
                    </div>
                    <Switch
                      checked={preferences.privacy.showLastSeen}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences,
                          privacy: {...preferences.privacy, showLastSeen: checked}
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Allow Direct Messages</Label>
                      <p className="text-sm text-muted-foreground">Let anyone send you direct messages</p>
                    </div>
                    <Switch
                      checked={preferences.privacy.allowDirectMessages}
                      onCheckedChange={(checked) => 
                        setPreferences({
                          ...preferences,
                          privacy: {...preferences.privacy, allowDirectMessages: checked}
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>Customize how OmniTalk looks and feels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={preferences.appearance.theme}
                      onValueChange={(value) => 
                        setPreferences({
                          ...preferences,
                          appearance: {...preferences.appearance, theme: value as 'light' | 'dark' | 'system'}
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={preferences.appearance.language}
                      onValueChange={(value) => 
                        setPreferences({
                          ...preferences,
                          appearance: {...preferences.appearance, language: value}
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileSave} disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Appearance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
