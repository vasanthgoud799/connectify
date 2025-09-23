import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  useFriends,
  Friend,
  FriendRequest,
  ContactSuggestion,
} from "@/contexts/FriendsContext";
import { useMessaging } from "@/contexts/MessagingContext";
import { useUser } from "@/contexts/UserContext";
import { useVideoCall } from "@/contexts/VideoCallContext";
import { useCallStore } from "@/stores/useCallStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  UserPlus,
  Users,
  Video,
  MessageCircle,
  Phone,
  MoreVertical,
  Check,
  X,
  Heart,
  HeartOff,
  UserX,
  Mail,
  MapPin,
  Building,
  Calendar,
  Star,
  StarOff,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Filter,
  SortAsc,
  ChevronDown,
  Crown,
  Shield,
  Clock,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Friends = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useUser();
  const { startCall } = useVideoCall();
  const initiateZCall = useCallStore((s) => s.initiateCall);
  const { createConversation, setActiveConversation } = useMessaging();
  const {
    friends,
    friendRequests,
    sentRequests,
    suggestions,
    blockedUsers,
    isLoading,
    isSending,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    addToFavorites,
    removeFromFavorites,
    updateCustomNote,
    searchUsers,
    importContacts,
    refreshSuggestions,
    acceptAllRequests,
    deleteAllRequests,
    getStats,
  } = useFriends();

  // Local state
  const [activeTab, setActiveTab] = useState("friends");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showImportContacts, setShowImportContacts] = useState(false);
  const [newFriendEmail, setNewFriendEmail] = useState("");
  const [newFriendMessage, setNewFriendMessage] = useState("");
  const [searchResults, setSearchResults] = useState<ContactSuggestion[]>([]);
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Statistics
  const stats = getStats();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      case "dnd":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  const formatLastSeen = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getReasonText = (reason: string) => {
    switch (reason) {
      case "mutual_friends":
        return "Mutual friends";
      case "company":
        return "Same company";
      case "linkedin":
        return "LinkedIn connection";
      case "email_contact":
        return "Email contact";
      default:
        return "Suggested for you";
    }
  };

  const openChat = async (friend: Friend) => {
    try {
      const conv = await createConversation([friend.userId], "direct");
      setActiveConversation(conv.id);
      navigate("/messages");
    } catch (e) {
      toast({
        title: "Unable to open chat",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStartCall = async (friend: Friend) => {
    try {
      initiateZCall(
        { id: friend.userId, name: friend.name, avatar: friend.avatar },
        "video",
      );
    } catch {}
  };

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const results = await searchUsers(query);
    setSearchResults(results);
  };

  const handleSendFriendRequest = async (userId: string, message?: string) => {
    await sendFriendRequest(userId, message);
    setShowAddFriend(false);
    setNewFriendEmail("");
    setNewFriendMessage("");
  };

  const handleUpdateNote = async (friendId: string) => {
    await updateCustomNote(friendId, noteText);
    setEditingNote(null);
    setNoteText("");
  };

  const filteredFriends = friends.filter((friend) => {
    const matchesSearch =
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || friend.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedFriends = [...filteredFriends].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "status":
        return a.status.localeCompare(b.status);
      case "recent":
        return b.lastSeen.getTime() - a.lastSeen.getTime();
      case "favorites":
        return Number(b.isFavorite) - Number(a.isFavorite);
      default:
        return 0;
    }
  });

  // Friend card component
  const FriendCard = ({
    friend,
    variant = "full",
  }: {
    friend: Friend;
    variant?: "full" | "compact";
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={friend.avatar} />
                <AvatarFallback>
                  {friend.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(friend.status)} rounded-full border-2 border-background`}
              ></div>
              {friend.isFavorite && (
                <Star className="absolute -top-1 -left-1 w-4 h-4 text-yellow-500 fill-current" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground truncate">
                  {friend.name}
                </h3>
                <Badge variant="outline" className="text-xs">
                  {friend.status}
                </Badge>
              </div>

              {variant === "full" && (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    {friend.email}
                  </p>

                  {friend.company && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                      <Building className="h-3 w-3" />
                      <span>
                        {friend.title} at {friend.company}
                      </span>
                    </div>
                  )}

                  {friend.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      <span>{friend.location}</span>
                    </div>
                  )}

                  {friend.bio && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {friend.bio}
                    </p>
                  )}

                  {friend.customNote && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-sm mb-2">
                      <strong>Note:</strong> {friend.customNote}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Last seen: {formatLastSeen(friend.lastSeen)}</span>
                    <span>{friend.mutualFriends} mutual friends</span>
                    <span>
                      Friends since {friend.addedAt.toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 ml-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleStartCall(friend)}
              disabled={friend.status === "offline"}
            >
              <Video className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => openChat(friend)}>
              <MessageCircle className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to={`/profile/${friend.userId}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setEditingNote(friend.id);
                    setNoteText(friend.customNote || "");
                  }}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {friend.customNote ? "Edit Note" : "Add Note"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    friend.isFavorite
                      ? removeFromFavorites(friend.id)
                      : addToFavorites(friend.id)
                  }
                >
                  {friend.isFavorite ? (
                    <>
                      <HeartOff className="h-4 w-4 mr-2" />
                      Remove from Favorites
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Add to Favorites
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => blockUser(friend.userId)}
                  className="text-destructive"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Block User
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => removeFriend(friend.id)}
                  className="text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove Friend
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Friend request card component
  const FriendRequestCard = ({
    request,
    type,
  }: {
    request: FriendRequest;
    type: "incoming" | "outgoing";
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.fromUser.avatar} />
              <AvatarFallback>{request.fromUser.name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {request.fromUser.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                {request.fromUser.email}
              </p>

              {request.message && (
                <p className="text-sm text-muted-foreground mb-2 italic">
                  "{request.message}"
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{formatLastSeen(request.sentAt)}</span>
                <span>{request.fromUser.mutualFriends} mutual friends</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {type === "incoming" ? (
              <>
                <Button
                  size="sm"
                  onClick={() => acceptFriendRequest(request.id)}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => declineFriendRequest(request.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelFriendRequest(request.id)}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Suggestion card component
  const SuggestionCard = ({
    suggestion,
  }: {
    suggestion: ContactSuggestion;
  }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={suggestion.avatar} />
              <AvatarFallback>{suggestion.name[0]}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="font-semibold text-foreground">
                {suggestion.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-1">
                {suggestion.email}
              </p>

              {suggestion.company && (
                <p className="text-sm text-muted-foreground mb-1">
                  {suggestion.title} at {suggestion.company}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{suggestion.mutualFriends} mutual friends</span>
                <Badge variant="secondary" className="text-xs">
                  {getReasonText(suggestion.reason)}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => handleSendFriendRequest(suggestion.id)}
            disabled={isSending}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Add Friend
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Link to="/dashboard" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">
                  Friends
                </span>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search friends..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab === "add") {
                      handleSearchUsers(e.target.value);
                    }
                  }}
                  className="pl-10 w-64"
                />
              </div>

              <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
                  </Button>
                </DialogTrigger>
                <DialogContent aria-describedby={undefined}>
                  <DialogHeader>
                    <DialogTitle>Add a Friend</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="friend-email">Email Address</Label>
                      <Input
                        id="friend-email"
                        value={newFriendEmail}
                        onChange={(e) => setNewFriendEmail(e.target.value)}
                        placeholder="Enter email address..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="friend-message">Message (Optional)</Label>
                      <Textarea
                        id="friend-message"
                        value={newFriendMessage}
                        onChange={(e) => setNewFriendMessage(e.target.value)}
                        placeholder="Add a personal message..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() =>
                          handleSendFriendRequest(
                            newFriendEmail,
                            newFriendMessage,
                          )
                        }
                        disabled={!newFriendEmail || isSending}
                        className="flex-1"
                      >
                        {isSending ? "Sending..." : "Send Request"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowAddFriend(false)}
                      >
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Friends</p>
                  <p className="text-2xl font-bold">{stats.totalFriends}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Online Now</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.onlineFriends}
                  </p>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Friend Requests
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.pendingRequests}
                  </p>
                </div>
                <UserPlus className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sent Requests</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.sentRequests}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-6">
            <TabsList className="grid w-auto grid-cols-5">
              <TabsTrigger value="friends">All Friends</TabsTrigger>
              <TabsTrigger value="requests">
                Requests ({friendRequests.length})
              </TabsTrigger>
              <TabsTrigger value="sent">
                Sent ({sentRequests.length})
              </TabsTrigger>
              <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
              <TabsTrigger value="blocked">Blocked</TabsTrigger>
            </TabsList>

            {activeTab === "friends" && (
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="favorites">Favorites</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={refreshSuggestions}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="friends" className="space-y-4">
            {sortedFriends.length > 0 ? (
              <div className="space-y-4">
                {sortedFriends.map((friend) => (
                  <FriendCard key={friend.id} friend={friend} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No friends found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try adjusting your search terms"
                      : "Start building your network by adding friends"}
                  </p>
                  <Button onClick={() => setShowAddFriend(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Friend
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {friendRequests.length > 0 && (
              <div className="flex justify-end gap-2 mb-4">
                <Button onClick={acceptAllRequests} size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  Accept All
                </Button>
                <Button onClick={deleteAllRequests} variant="outline" size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </div>
            )}

            {friendRequests.length > 0 ? (
              <div className="space-y-4">
                {friendRequests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    type="incoming"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No friend requests
                  </h3>
                  <p className="text-muted-foreground">You're all caught up!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentRequests.length > 0 ? (
              <div className="space-y-4">
                {sentRequests.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    type="outgoing"
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No pending requests
                  </h3>
                  <p className="text-muted-foreground">
                    You haven't sent any friend requests yet
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button onClick={refreshSuggestions} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Suggestions
              </Button>
            </div>

            {suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <SuggestionCard key={suggestion.id} suggestion={suggestion} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No suggestions</h3>
                  <p className="text-muted-foreground">
                    Check back later for new friend suggestions
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="blocked" className="space-y-4">
            {blockedUsers.length > 0 ? (
              <div className="space-y-4">
                {blockedUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{user.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => unblockUser(user.userId)}
                          variant="outline"
                        >
                          Unblock
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No blocked users
                  </h3>
                  <p className="text-muted-foreground">
                    You haven't blocked anyone
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Note Dialog */}
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Add/Edit Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a personal note about this friend..."
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => editingNote && handleUpdateNote(editingNote)}
                  className="flex-1"
                >
                  Save Note
                </Button>
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Friends;
