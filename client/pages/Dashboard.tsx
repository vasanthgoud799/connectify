import { Button } from "@/components/ui/button";
import { 
  Video, 
  Users, 
  UserPlus, 
  Phone, 
  MessageCircle,
  Settings,
  Bell,
  Search,
  MoreVertical,
  PhoneCall
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  // Mock user data - in a real app this would come from authentication context
  const user = {
    name: "Vinay Shivagoni",
    email: "shivagonivinaygoudv@gmail.com",
    avatar: null,
    status: "online"
  };

  // Mock friends data
  const friends = [
    { id: 1, name: "John Doe", status: "online", avatar: null, lastSeen: "now" },
    { id: 2, name: "Sarah Wilson", status: "away", avatar: null, lastSeen: "5 min ago" },
    { id: 3, name: "Mike Johnson", status: "offline", avatar: null, lastSeen: "2 hours ago" },
    { id: 4, name: "Emily Davis", status: "busy", avatar: null, lastSeen: "now" },
  ];

  const handleStartCall = (friendName: string) => {
    // TODO: Implement video call functionality
    console.log(`Starting call with ${friendName}`);
  };

  const handleStartGroupCall = () => {
    // TODO: Implement group call functionality
    console.log("Starting group call");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "bg-online";
      case "away": return "bg-away";
      case "busy": return "bg-busy";
      default: return "bg-offline";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">ConnectSphere</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon">
                <Search className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center space-x-3 pl-3 border-l border-border">
                <div className="relative">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-brand-700">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-background`}></div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}!</h1>
                  <p className="text-brand-100 mt-1">Ready to connect with your friends?</p>
                </div>
                <div className="hidden sm:block">
                  <Video className="w-12 h-12 text-white/80" />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button 
                  variant="secondary" 
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30"
                  onClick={handleStartGroupCall}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Start Group Call
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                  asChild
                >
                  <Link to="/friends">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friends
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Video Calls</h3>
                <p className="text-sm text-muted-foreground mb-4">Start a video call with crystal clear quality</p>
                <Button size="sm" className="w-full">Start Call</Button>
              </div>
              
              <div className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Voice Calls</h3>
                <p className="text-sm text-muted-foreground mb-4">Make high-quality voice calls anywhere</p>
                <Button size="sm" variant="outline" className="w-full">Voice Call</Button>
              </div>
              
              <div className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Messages</h3>
                <p className="text-sm text-muted-foreground mb-4">Send messages during or after calls</p>
                <Button size="sm" variant="outline" className="w-full">Open Chat</Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                    <PhoneCall className="w-4 h-4 text-success-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Call with John Doe</p>
                    <p className="text-xs text-muted-foreground">15 minutes - 2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Group call with 4 people</p>
                    <p className="text-xs text-muted-foreground">45 minutes - Yesterday</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Sarah Wilson added as friend</p>
                    <p className="text-xs text-muted-foreground">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Friends Sidebar */}
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Friends</h2>
                <Button size="sm" variant="outline">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="relative">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">
                          {friend.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getStatusColor(friend.status)} rounded-full border-2 border-background`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{friend.name}</p>
                      <p className="text-xs text-muted-foreground">{friend.lastSeen}</p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-8 h-8 p-0"
                        onClick={() => handleStartCall(friend.name)}
                        disabled={friend.status === 'offline'}
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link to="/friends">View All Friends</Link>
              </Button>
            </div>

            {/* Status Card */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Your Status</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 ${getStatusColor(user.status)} rounded-full`}></div>
                  <span className="text-sm text-foreground capitalize">{user.status}</span>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Change Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
