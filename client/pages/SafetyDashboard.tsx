import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSafety } from '@/contexts/SafetyContext';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Shield,
  Lock,
  Eye,
  EyeOff,
  UserX,
  AlertTriangle,
  Settings,
  Download,
  Trash2,
  Copy,
  Check,
  X,
  Flag,
  Users,
  MessageSquare,
  Phone,
  FileText,
  Activity,
  Globe,
  Smartphone,
  Monitor,
  Key,
  ShieldCheck,
  BarChart3,
  TrendingUp,
  Clock,
  MapPin,
  Wifi,
  MoreVertical,
  Plus,
  Edit,
  Save,
  RefreshCw,
  Ban,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SafetyDashboard = () => {
  const { user, isAuthenticated } = useUser();
  const { toast } = useToast();
  const {
    blockedUsers,
    reports,
    privacySettings,
    securitySettings,
    moderationRules,
    moderationActions,
    blockUser,
    unblockUser,
    createReport,
    updatePrivacySettings,
    enable2FA,
    disable2FA,
    revokeSession,
    revokeAllSessions,
    requestDataDownload,
    scheduleAccountDeletion,
    cancelAccountDeletion,
    createModerationRule,
    updateModerationRule,
    deleteModerationRule,
    takeAction,
    getSafetyMetrics,
    getUserSafetyScore
  } = useSafety();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [safetyMetrics, setSafetyMetrics] = useState<any>(null);
  const [safetyScore, setSafetyScore] = useState<any>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState<string[]>([]);
  const [reportForm, setReportForm] = useState({
    reportedUserId: '',
    reportedUserName: '',
    type: 'harassment' as const,
    category: 'message' as const,
    description: '',
    severity: 'medium' as const
  });
  const [newRuleForm, setNewRuleForm] = useState({
    name: '',
    description: '',
    type: 'keyword' as const,
    action: 'warn' as const,
    severity: 'medium' as const,
    keywords: ''
  });

  // Authentication check
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Please sign in</h1>
          <Button asChild>
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Load data
  useEffect(() => {
    Promise.all([
      getSafetyMetrics(),
      getUserSafetyScore()
    ]).then(([metrics, score]) => {
      setSafetyMetrics(metrics);
      setSafetyScore(score);
    });
  }, [getSafetyMetrics, getUserSafetyScore]);

  const handleSubmitReport = async () => {
    await createReport(reportForm);
    setShowReportDialog(false);
    setReportForm({
      reportedUserId: '',
      reportedUserName: '',
      type: 'harassment',
      category: 'message',
      description: '',
      severity: 'medium'
    });
  };

  const handleEnable2FA = async () => {
    const backupCodes = await enable2FA('app');
    setShowBackupCodes(backupCodes);
    setShow2FADialog(false);
  };

  const handleCreateRule = async () => {
    await createModerationRule({
      ...newRuleForm,
      enabled: true,
      keywords: newRuleForm.keywords.split(',').map(k => k.trim()).filter(Boolean)
    });
    setNewRuleForm({
      name: '',
      description: '',
      type: 'keyword',
      action: 'warn',
      severity: 'medium',
      keywords: ''
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'under_review': return 'text-blue-600 bg-blue-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'dismissed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">Safety & Privacy</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              {safetyScore && (
                <Badge variant="outline" className="hidden sm:flex">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  Safety Score: {safetyScore.score}/100
                </Badge>
              )}
              
              <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Flag className="h-4 w-4 mr-2" />
                    Report Issue
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report a Safety Issue</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Report Type</Label>
                        <Select 
                          value={reportForm.type}
                          onValueChange={(value: any) => setReportForm(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="harassment">Harassment</SelectItem>
                            <SelectItem value="spam">Spam</SelectItem>
                            <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                            <SelectItem value="hate_speech">Hate Speech</SelectItem>
                            <SelectItem value="violence">Violence</SelectItem>
                            <SelectItem value="impersonation">Impersonation</SelectItem>
                            <SelectItem value="copyright">Copyright</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Select 
                          value={reportForm.category}
                          onValueChange={(value: any) => setReportForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="message">Message</SelectItem>
                            <SelectItem value="call">Call</SelectItem>
                            <SelectItem value="profile">Profile</SelectItem>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="behavior">Behavior</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div>
                      <Label>User to Report</Label>
                      <Input
                        placeholder="Enter username or user ID"
                        value={reportForm.reportedUserName}
                        onChange={(e) => setReportForm(prev => ({ 
                          ...prev, 
                          reportedUserName: e.target.value,
                          reportedUserId: e.target.value 
                        }))}
                      />
                    </div>
                    
                    <div>
                      <Label>Severity</Label>
                      <Select 
                        value={reportForm.severity}
                        onValueChange={(value: any) => setReportForm(prev => ({ ...prev, severity: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Please describe what happened..."
                        value={reportForm.description}
                        onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleSubmitReport} className="flex-1">
                        Submit Report
                      </Button>
                      <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        {safetyMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Safety Score</p>
                    <p className="text-2xl font-bold text-green-600">{safetyScore?.score || 0}/100</p>
                  </div>
                  <ShieldCheck className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold">{safetyMetrics.totalReports}</p>
                  </div>
                  <Flag className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Blocked Users</p>
                    <p className="text-2xl font-bold text-red-600">{safetyMetrics.blockedUsers}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Content Flagged</p>
                    <p className="text-2xl font-bold text-yellow-600">{safetyMetrics.contentFlagged}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Actions Taken</p>
                    <p className="text-2xl font-bold text-blue-600">{safetyMetrics.moderationActions}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="blocked">Blocked</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="moderation">Moderation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Safety Score */}
            {safetyScore && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Your Safety Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-green-600">{safetyScore.score}/100</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${safetyScore.score}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {safetyScore.score >= 80 ? 'Excellent' : 
                         safetyScore.score >= 60 ? 'Good' : 
                         safetyScore.score >= 40 ? 'Fair' : 'Needs Improvement'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Contributing Factors:</h4>
                    {safetyScore.factors.map((factor: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          {factor.impact === 'positive' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {factor.impact === 'negative' && <AlertCircle className="h-4 w-4 text-red-500" />}
                          {factor.impact === 'neutral' && <Info className="h-4 w-4 text-blue-500" />}
                          <span className="font-medium">{factor.category}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  {safetyScore.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold">Recommendations:</h4>
                      <ul className="space-y-1">
                        {safetyScore.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Safety Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setShow2FADialog(true)}
                  >
                    <Key className="h-6 w-6" />
                    {securitySettings.twoFactorAuth.enabled ? 'Manage 2FA' : 'Enable 2FA'}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setActiveTab('privacy')}
                  >
                    <Eye className="h-6 w-6" />
                    Privacy Settings
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => setShowReportDialog(true)}
                  >
                    <Flag className="h-6 w-6" />
                    Report Issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            {/* Profile Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Email Address</Label>
                        <p className="text-sm text-muted-foreground">Who can see your email address</p>
                      </div>
                      <Select 
                        value={privacySettings.profile.showEmail}
                        onValueChange={(value: any) => updatePrivacySettings({
                          profile: { ...privacySettings.profile, showEmail: value }
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="friends">Friends</SelectItem>
                          <SelectItem value="nobody">Nobody</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Online Status</Label>
                        <p className="text-sm text-muted-foreground">Who can see when you're online</p>
                      </div>
                      <Select 
                        value={privacySettings.profile.showStatus}
                        onValueChange={(value: any) => updatePrivacySettings({
                          profile: { ...privacySettings.profile, showStatus: value }
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="friends">Friends</SelectItem>
                          <SelectItem value="nobody">Nobody</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Last Seen</Label>
                        <p className="text-sm text-muted-foreground">Who can see when you were last active</p>
                      </div>
                      <Select 
                        value={privacySettings.profile.showLastSeen}
                        onValueChange={(value: any) => updatePrivacySettings({
                          profile: { ...privacySettings.profile, showLastSeen: value }
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="friends">Friends</SelectItem>
                          <SelectItem value="nobody">Nobody</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Friend Requests</Label>
                        <p className="text-sm text-muted-foreground">Who can send you friend requests</p>
                      </div>
                      <Select 
                        value={privacySettings.profile.allowFriendRequests}
                        onValueChange={(value: any) => updatePrivacySettings({
                          profile: { ...privacySettings.profile, allowFriendRequests: value }
                        })}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="friends_of_friends">Friends of Friends</SelectItem>
                          <SelectItem value="nobody">Nobody</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Mutual Friends</Label>
                        <p className="text-sm text-muted-foreground">Allow others to see mutual connections</p>
                      </div>
                      <Switch 
                        checked={privacySettings.profile.showMutualFriends}
                        onCheckedChange={(checked) => updatePrivacySettings({
                          profile: { ...privacySettings.profile, showMutualFriends: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Communication Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Communication Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Who Can Message You</Label>
                        <p className="text-sm text-muted-foreground">Control who can send you messages</p>
                      </div>
                      <Select 
                        value={privacySettings.communication.whoCanMessage}
                        onValueChange={(value: any) => updatePrivacySettings({
                          communication: { ...privacySettings.communication, whoCanMessage: value }
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="friends">Friends</SelectItem>
                          <SelectItem value="nobody">Nobody</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Who Can Call You</Label>
                        <p className="text-sm text-muted-foreground">Control who can call you</p>
                      </div>
                      <Select 
                        value={privacySettings.communication.whoCanCall}
                        onValueChange={(value: any) => updatePrivacySettings({
                          communication: { ...privacySettings.communication, whoCanCall: value }
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="everyone">Everyone</SelectItem>
                          <SelectItem value="friends">Friends</SelectItem>
                          <SelectItem value="nobody">Nobody</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Read Receipts</Label>
                        <p className="text-sm text-muted-foreground">Show when you've read messages</p>
                      </div>
                      <Switch 
                        checked={privacySettings.communication.readReceipts}
                        onCheckedChange={(checked) => updatePrivacySettings({
                          communication: { ...privacySettings.communication, readReceipts: checked }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Typing Indicators</Label>
                        <p className="text-sm text-muted-foreground">Show when you're typing</p>
                      </div>
                      <Switch 
                        checked={privacySettings.communication.typingIndicators}
                        onCheckedChange={(checked) => updatePrivacySettings({
                          communication: { ...privacySettings.communication, typingIndicators: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Safety Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Content Filter</Label>
                        <p className="text-sm text-muted-foreground">Filter inappropriate content</p>
                      </div>
                      <Select 
                        value={privacySettings.safety.contentFilter}
                        onValueChange={(value: any) => updatePrivacySettings({
                          safety: { ...privacySettings.safety, contentFilter: value }
                        })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="strict">Strict</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="off">Off</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-block Spam</Label>
                        <p className="text-sm text-muted-foreground">Automatically block suspected spam</p>
                      </div>
                      <Switch 
                        checked={privacySettings.safety.autoBlockSpam}
                        onCheckedChange={(checked) => updatePrivacySettings({
                          safety: { ...privacySettings.safety, autoBlockSpam: checked }
                        })}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Hide from Search</Label>
                        <p className="text-sm text-muted-foreground">Prevent others from finding you in search</p>
                      </div>
                      <Switch 
                        checked={privacySettings.safety.hideFromSearch}
                        onCheckedChange={(checked) => updatePrivacySettings({
                          safety: { ...privacySettings.safety, hideFromSearch: checked }
                        })}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Anonymous Usage Data</Label>
                        <p className="text-sm text-muted-foreground">Help improve our services</p>
                      </div>
                      <Switch 
                        checked={privacySettings.safety.anonymousUsageData}
                        onCheckedChange={(checked) => updatePrivacySettings({
                          safety: { ...privacySettings.safety, anonymousUsageData: checked }
                        })}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Two-Factor Authentication */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Two-Factor Authentication</span>
                  <Badge variant={securitySettings.twoFactorAuth.enabled ? "default" : "secondary"}>
                    {securitySettings.twoFactorAuth.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account by requiring a second form of authentication.
                </p>
                
                {securitySettings.twoFactorAuth.enabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">2FA is enabled</p>
                          <p className="text-sm text-muted-foreground">
                            Method: {securitySettings.twoFactorAuth.method.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <Button variant="destructive" onClick={disable2FA}>
                        Disable 2FA
                      </Button>
                    </div>
                    
                    {securitySettings.twoFactorAuth.backupCodes.length > 0 && (
                      <div className="p-4 border rounded-lg">
                        <h4 className="font-medium mb-2">Backup Codes</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Save these codes in a safe place. You can use them to access your account if you lose your authenticator.
                        </p>
                        <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                          {securitySettings.twoFactorAuth.backupCodes.map((code, index) => (
                            <code key={index} className="p-2 bg-muted rounded">{code}</code>
                          ))}
                        </div>
                        <Button variant="outline" size="sm" className="mt-3">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy All Codes
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Button onClick={() => setShow2FADialog(true)}>
                    <Key className="h-4 w-4 mr-2" />
                    Enable Two-Factor Authentication
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Active Sessions</span>
                  <Button variant="outline" size="sm" onClick={revokeAllSessions}>
                    Sign Out All Devices
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {securitySettings.sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {session.deviceName.includes('iPhone') || session.deviceName.includes('Android') ? 
                          <Smartphone className="h-5 w-5 text-muted-foreground" /> :
                          <Monitor className="h-5 w-5 text-muted-foreground" />
                        }
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            {session.deviceName}
                            {session.isCurrent && <Badge variant="secondary">Current</Badge>}
                          </p>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Wifi className="h-3 w-3" />
                                {session.ipAddress}
                              </span>
                            </div>
                            <p>Last activity: {session.lastActivity.toLocaleDateString()} at {session.lastActivity.toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => revokeSession(session.id)}
                        >
                          Sign Out
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Data & Privacy */}
            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Download Your Data</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get a copy of all your data in OmniTalk.
                      </p>
                      {securitySettings.dataAndPrivacy.downloadMyData.status === 'ready' ? (
                        <Button asChild>
                          <a href={securitySettings.dataAndPrivacy.downloadMyData.downloadUrl}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Archive
                          </a>
                        </Button>
                      ) : securitySettings.dataAndPrivacy.downloadMyData.status === 'processing' ? (
                        <Button disabled>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </Button>
                      ) : (
                        <Button onClick={requestDataDownload}>
                          <Download className="h-4 w-4 mr-2" />
                          Request Data
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg border-red-200">
                      <h4 className="font-medium mb-2 text-red-600">Delete Account</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Permanently delete your account and all associated data.
                      </p>
                      {securitySettings.dataAndPrivacy.deleteAccount.scheduled ? (
                        <div className="space-y-2">
                          <p className="text-sm text-red-600">
                            Account deletion scheduled for {securitySettings.dataAndPrivacy.deleteAccount.scheduled.toLocaleDateString()}
                          </p>
                          <Button variant="outline" onClick={cancelAccountDeletion}>
                            Cancel Deletion
                          </Button>
                        </div>
                      ) : (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => scheduleAccountDeletion(30)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Account
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Blocked Users ({blockedUsers.length})</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserX className="h-4 w-4 mr-2" />
                        Block User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Block a User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input placeholder="Enter username or user ID" />
                        <Textarea placeholder="Reason for blocking (optional)" />
                        <Button className="w-full">Block User</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {blockedUsers.length > 0 ? (
                  <div className="space-y-4">
                    {blockedUsers.map((blockedUser) => (
                      <div key={blockedUser.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <UserX className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="font-medium">{blockedUser.name}</p>
                            <p className="text-sm text-muted-foreground">{blockedUser.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Blocked on {blockedUser.blockedAt.toLocaleDateString()}
                              {blockedUser.reason && ` • ${blockedUser.reason}`}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => unblockUser(blockedUser.userId)}
                        >
                          Unblock
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No blocked users</h3>
                    <p className="text-muted-foreground">You haven't blocked anyone yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>My Reports ({reports.length})</span>
                  <Button onClick={() => setShowReportDialog(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    New Report
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((report) => (
                      <div key={report.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{report.type.replace('_', ' ').toUpperCase()}</h4>
                              <Badge className={getStatusColor(report.status)}>
                                {report.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className={getSeverityColor(report.severity)}>
                                {report.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Reported: {report.reportedUserName} • {report.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>Update</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Withdraw Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <p className="text-sm mb-3">{report.description}</p>
                        
                        {report.resolution && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm font-medium mb-1">Resolution:</p>
                            <p className="text-sm">{report.resolution.note}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Resolved by {report.resolution.resolvedBy} on {report.resolution.resolvedAt.toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No reports</h3>
                    <p className="text-muted-foreground">You haven't submitted any reports yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            {/* Moderation Rules (Admin) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Content Moderation Rules</span>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Moderation Rule</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Rule Name</Label>
                          <Input
                            value={newRuleForm.name}
                            onChange={(e) => setNewRuleForm(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter rule name"
                          />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea
                            value={newRuleForm.description}
                            onChange={(e) => setNewRuleForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe what this rule does"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Type</Label>
                            <Select 
                              value={newRuleForm.type}
                              onValueChange={(value: any) => setNewRuleForm(prev => ({ ...prev, type: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="keyword">Keyword</SelectItem>
                                <SelectItem value="pattern">Pattern</SelectItem>
                                <SelectItem value="ai_detection">AI Detection</SelectItem>
                                <SelectItem value="image_analysis">Image Analysis</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Action</Label>
                            <Select 
                              value={newRuleForm.action}
                              onValueChange={(value: any) => setNewRuleForm(prev => ({ ...prev, action: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="flag">Flag</SelectItem>
                                <SelectItem value="warn">Warn</SelectItem>
                                <SelectItem value="block">Block</SelectItem>
                                <SelectItem value="auto_delete">Auto Delete</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        {newRuleForm.type === 'keyword' && (
                          <div>
                            <Label>Keywords (comma-separated)</Label>
                            <Input
                              value={newRuleForm.keywords}
                              onChange={(e) => setNewRuleForm(prev => ({ ...prev, keywords: e.target.value }))}
                              placeholder="spam, inappropriate, offensive"
                            />
                          </div>
                        )}
                        <Button onClick={handleCreateRule} className="w-full">
                          Create Rule
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moderationRules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge variant={rule.enabled ? "default" : "secondary"}>
                            {rule.enabled ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline" className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Type: {rule.type.replace('_', ' ')}</span>
                          <span>Action: {rule.action.replace('_', ' ')}</span>
                          <span>Created: {rule.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={(checked) => updateModerationRule(rule.id, { enabled: checked })}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Rule
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteModerationRule(rule.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Moderation Actions</CardTitle>
              </CardHeader>
              <CardContent>
                {moderationActions.length > 0 ? (
                  <div className="space-y-4">
                    {moderationActions.map((action) => (
                      <div key={action.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {action.action.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <span className="text-sm font-medium">{action.targetType} {action.targetId}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              By {action.moderatorName} • {action.createdAt.toLocaleDateString()}
                            </p>
                          </div>
                          {action.appealable && (
                            <Button variant="outline" size="sm">
                              Appeal
                            </Button>
                          )}
                        </div>
                        <p className="text-sm mb-2">{action.reason}</p>
                        {action.duration && (
                          <p className="text-xs text-muted-foreground">
                            Duration: {action.duration} hours
                            {action.expiresAt && ` • Expires: ${action.expiresAt.toLocaleDateString()}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No recent actions</h3>
                    <p className="text-muted-foreground">No moderation actions have been taken recently.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 2FA Setup Dialog */}
        <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication adds an extra layer of security to your account by requiring a second verification step.
              </p>
              <div className="space-y-3">
                <Button onClick={handleEnable2FA} className="w-full justify-start">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Use Authenticator App (Recommended)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Use SMS
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Use Email
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Backup Codes Dialog */}
        <Dialog open={showBackupCodes.length > 0} onOpenChange={() => setShowBackupCodes([])}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Your Backup Codes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
              </p>
              <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                {showBackupCodes.map((code, index) => (
                  <code key={index} className="font-mono text-sm p-2 bg-background rounded">
                    {code}
                  </code>
                ))}
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(showBackupCodes.join('\n'));
                    toast({ title: "Backup codes copied", description: "Save them in a secure location" });
                  }}
                  className="flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Codes
                </Button>
                <Button variant="outline" onClick={() => setShowBackupCodes([])}>
                  Done
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SafetyDashboard;
