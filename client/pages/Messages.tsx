import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Send,
  Paperclip,
  Smile,
  Search,
  Phone,
  Video,
  MoreVertical,
  Plus,
  Settings,
  Archive,
  Pin,
  Volume2,
  VolumeX,
  Edit,
  Trash2,
  Reply,
  Copy,
  Star,
  Image,
  File,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import {
  useMessaging,
  Message,
  Conversation,
} from "@/contexts/MessagingContext";
import { useVideoCall } from "@/contexts/VideoCallContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const EMOJI_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

export default function Messages() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useUser();
  const {
    conversations,
    activeConversation,
    messages,
    setActiveConversation,
    sendMessage,
    addReaction,
    removeReaction,
    uploadFile,
    markAsRead,
    updateConversationSettings,
    deleteConversation,
    editMessage,
    deleteMessage,
  } = useMessaging();
  const { startCall } = useVideoCall();
  const { toast } = useToast();

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeConversation]);

  // Auto-resize message input
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.style.height = "auto";
      messageInputRef.current.style.height = `${messageInputRef.current.scrollHeight}px`;
    }
  }, [messageInput]);

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

  const handleSendMessage = async () => {
    if (!activeConversation || !messageInput.trim()) return;

    try {
      await sendMessage(
        activeConversation.id,
        messageInput,
        "text",
        replyToMessage?.id,
      );
      setMessageInput("");
      setReplyToMessage(null);
      setIsTyping(false);
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditMessage = async () => {
    if (!editingMessage || !editContent.trim()) return;

    try {
      await editMessage(editingMessage.id, editContent);
      setEditingMessage(null);
      setEditContent("");
      toast({
        title: "Message updated",
        description: "Your message has been edited.",
      });
    } catch (error) {
      toast({
        title: "Failed to edit message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast({
        title: "Message deleted",
        description: "The message has been removed.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete message",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeConversation) return;

    // Check file size (max 250MB)
    if (file.size > 250 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose a file smaller than 250MB.",
        variant: "destructive",
      });
      return;
    }

    uploadFile(file, activeConversation.id);
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // Check if user already reacted with this emoji
      const message = messages[activeConversation?.id || ""]?.find(
        (m) => m.id === messageId,
      );
      const existingReaction = message?.reactions?.find(
        (r) => r.emoji === emoji && r.userId === user.id,
      );

      if (existingReaction) {
        await removeReaction(messageId, emoji);
      } else {
        await addReaction(messageId, emoji);
      }
    } catch (error) {
      toast({
        title: "Failed to update reaction",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return timestamp.toLocaleDateString();
  };

  const getConversationName = (conversation: Conversation) => {
    if (conversation.type === "group") {
      return conversation.name || "Group Chat";
    }

    // Direct message - get the other participant's name
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== user.id,
    );
    return otherParticipant?.name || "Unknown User";
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === "group") {
      return conversation.avatar;
    }

    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== user.id,
    );
    return otherParticipant?.avatar;
  };

  const filteredConversations = conversations.filter(
    (conv) =>
      searchQuery === "" ||
      getConversationName(conv)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.content
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-foreground">
                OmniTalk
              </span>
            </Link>

            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setActiveConversation(conversation.id)}
                className={cn(
                  "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                  "hover:bg-muted/50",
                  activeConversation?.id === conversation.id ? "bg-muted" : "",
                )}
              >
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={getConversationAvatar(conversation)} />
                    <AvatarFallback>
                      {conversation.type === "group"
                        ? "👥"
                        : getConversationName(conversation)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {conversation.settings.pinned && (
                    <Pin className="absolute -top-1 -right-1 w-3 h-3 text-brand-600" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-foreground truncate">
                      {getConversationName(conversation)}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(conversation.lastMessage.timestamp)}
                        </span>
                      )}
                      {conversation.settings.muted && (
                        <VolumeX className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage
                        ? `${conversation.lastMessage.senderName}: ${conversation.lastMessage.content}`
                        : "No messages yet"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge
                        variant="default"
                        className="ml-2 px-2 py-0.5 text-xs"
                      >
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={getConversationAvatar(activeConversation)}
                  />
                  <AvatarFallback>
                    {activeConversation.type === "group"
                      ? "👥"
                      : getConversationName(activeConversation)
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="font-semibold text-foreground">
                    {getConversationName(activeConversation)}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {activeConversation.type === "group"
                      ? `${activeConversation.participants.length} members`
                      : "Direct message"}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const participants = activeConversation.participants
                      .filter((p) => p.userId !== user.id)
                      .map((p) => p.userId);

                    await startCall(
                      participants,
                      `Audio call with ${getConversationName(activeConversation)}`,
                    );
                    navigate("/call");
                  }}
                >
                  <Phone className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const participants = activeConversation.participants
                      .filter((p) => p.userId !== user.id)
                      .map((p) => p.userId);

                    await startCall(
                      participants,
                      `Video call with ${getConversationName(activeConversation)}`,
                    );
                    navigate("/call");
                  }}
                >
                  <Video className="w-4 h-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem
                      onClick={() =>
                        updateConversationSettings(activeConversation.id, {
                          pinned: !activeConversation.settings.pinned,
                        })
                      }
                    >
                      <Pin className="w-4 h-4 mr-2" />
                      {activeConversation.settings.pinned
                        ? "Unpin"
                        : "Pin"}{" "}
                      Conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateConversationSettings(activeConversation.id, {
                          muted: !activeConversation.settings.muted,
                        })
                      }
                    >
                      {activeConversation.settings.muted ? (
                        <Volume2 className="w-4 h-4 mr-2" />
                      ) : (
                        <VolumeX className="w-4 h-4 mr-2" />
                      )}
                      {activeConversation.settings.muted ? "Unmute" : "Mute"}{" "}
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        updateConversationSettings(activeConversation.id, {
                          archived: !activeConversation.settings.archived,
                        })
                      }
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      {activeConversation.settings.archived
                        ? "Unarchive"
                        : "Archive"}{" "}
                      Conversation
                    </DropdownMenuItem>
                    <Separator />
                    <DropdownMenuItem
                      onClick={() => deleteConversation(activeConversation.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages[activeConversation.id]?.map((message, index) => {
                  const isOwn = message.senderId === user.id;
                  const showAvatar =
                    !isOwn &&
                    (index === 0 ||
                      messages[activeConversation.id][index - 1]?.senderId !==
                        message.senderId);

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isOwn ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "flex space-x-2 max-w-[70%]",
                          isOwn ? "flex-row-reverse space-x-reverse" : "",
                        )}
                      >
                        {showAvatar && (
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={message.senderAvatar} />
                            <AvatarFallback>
                              {message.senderName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={cn(
                            "space-y-1",
                            !showAvatar && !isOwn ? "ml-10" : "",
                          )}
                        >
                          {!isOwn && showAvatar && (
                            <p className="text-xs font-medium text-foreground">
                              {message.senderName}
                            </p>
                          )}

                          {message.replyTo && (
                            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border-l-2 border-brand-500">
                              <p className="font-medium">
                                {message.replyTo.senderName}
                              </p>
                              <p className="truncate">
                                {message.replyTo.content}
                              </p>
                            </div>
                          )}

                          <div className="group relative">
                            <div
                              className={cn(
                                "px-3 py-2 rounded-lg text-sm",
                                isOwn
                                  ? "bg-brand-500 text-white"
                                  : "bg-muted text-foreground",
                                message.isDeleted ? "italic opacity-50" : "",
                              )}
                            >
                              {editingMessage?.id === message.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) =>
                                      setEditContent(e.target.value)
                                    }
                                    className="min-h-[60px]"
                                    autoFocus
                                  />
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={handleEditMessage}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingMessage(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="whitespace-pre-wrap">
                                    {message.content}
                                  </p>
                                  {message.editedAt && (
                                    <p className="text-xs opacity-70 mt-1">
                                      (edited)
                                    </p>
                                  )}
                                </>
                              )}
                            </div>

                            {/* Message Actions */}
                            {!message.isDeleted &&
                              editingMessage?.id !== message.id && (
                                <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="flex items-center space-x-1 bg-background border border-border rounded-lg p-1 shadow-sm">
                                    {EMOJI_REACTIONS.map((emoji) => (
                                      <Button
                                        key={emoji}
                                        size="sm"
                                        variant="ghost"
                                        className="h-6 w-6 p-0 text-xs"
                                        onClick={() =>
                                          handleReaction(message.id, emoji)
                                        }
                                      >
                                        {emoji}
                                      </Button>
                                    ))}

                                    <Separator
                                      orientation="vertical"
                                      className="h-4"
                                    />

                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => setReplyToMessage(message)}
                                    >
                                      <Reply className="w-3 h-3" />
                                    </Button>

                                    {isOwn && (
                                      <>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0"
                                          onClick={() => {
                                            setEditingMessage(message);
                                            setEditContent(message.content);
                                          }}
                                        >
                                          <Edit className="w-3 h-3" />
                                        </Button>

                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-destructive"
                                          onClick={() =>
                                            handleDeleteMessage(message.id)
                                          }
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Reactions */}
                            {message.reactions &&
                              message.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(
                                    message.reactions.reduce(
                                      (acc, reaction) => {
                                        if (!acc[reaction.emoji]) {
                                          acc[reaction.emoji] = [];
                                        }
                                        acc[reaction.emoji].push(reaction);
                                        return acc;
                                      },
                                      {} as Record<
                                        string,
                                        typeof message.reactions
                                      >,
                                    ),
                                  ).map(([emoji, reactions]) => (
                                    <Button
                                      key={emoji}
                                      size="sm"
                                      variant="outline"
                                      className={cn(
                                        "h-6 px-2 text-xs",
                                        reactions.some(
                                          (r) => r.userId === user.id,
                                        )
                                          ? "bg-brand-100 border-brand-500"
                                          : "",
                                      )}
                                      onClick={() =>
                                        handleReaction(message.id, emoji)
                                      }
                                    >
                                      {emoji} {reactions.length}
                                    </Button>
                                  ))}
                                </div>
                              )}
                          </div>

                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply Preview */}
            {replyToMessage && (
              <div className="p-4 bg-muted/50 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">
                    Replying to {replyToMessage.senderName}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setReplyToMessage(null)}
                  >
                    ×
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {replyToMessage.content}
                </p>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-end space-x-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-4 h-4" />
                </Button>

                <div className="flex-1">
                  <Textarea
                    ref={messageInputRef}
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[44px] max-h-32 resize-none"
                    rows={1}
                  />
                </div>

                <Button size="sm" variant="ghost">
                  <Smile className="w-4 h-4" />
                </Button>

                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
            />
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Video className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Welcome to OmniTalk
                </h2>
                <p className="text-muted-foreground">
                  Select a conversation to start messaging
                </p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Start New Conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
