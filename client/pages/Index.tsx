import { Button } from "@/components/ui/button";
import { 
  Video, 
  Users, 
  Shield, 
  Monitor, 
  UserPlus, 
  MessageCircle,
  Play,
  CheckCircle,
  Star,
  Camera,
  Mic,
  Globe
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">ConnectSphere</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#security" className="text-muted-foreground hover:text-foreground transition-colors">Security</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <Button variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-brand-50/20 to-brand-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
                  Connect. <span className="text-brand-600">Communicate.</span> Collaborate.
                </h1>
                <p className="text-xl text-muted-foreground">
                  Experience crystal-clear video calls with friends, family, and teams. 
                  ConnectSphere brings you closer together with secure, high-quality communication.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8 py-6" asChild>
                  <Link to="/signup">
                    <Play className="w-5 h-5 mr-2" />
                    Start Calling Free
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                  <Link to="/demo">
                    <Video className="w-5 h-5 mr-2" />
                    Watch Demo
                  </Link>
                </Button>
              </div>
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Free to start</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>End-to-end encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>No downloads required</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-medium">Video Call</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Mic className="w-4 h-4 text-white" />
                      </div>
                      <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-lg p-4 h-24 flex items-center justify-center">
                      <Users className="w-8 h-8 text-white/60" />
                    </div>
                    <div className="bg-white/10 rounded-lg p-4 h-24 flex items-center justify-center">
                      <Users className="w-8 h-8 text-white/60" />
                    </div>
                  </div>
                  <div className="flex items-center justify-center space-x-4 pt-2">
                    <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                      <Monitor className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Everything you need for seamless communication
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              ConnectSphere provides all the tools you need for professional and personal video communication.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">HD Video Calling</h3>
              <p className="text-muted-foreground">Crystal-clear video calls with adaptive quality that adjusts to your connection.</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Group Calls</h3>
              <p className="text-muted-foreground">Host video conferences with up to 16 participants with speaker view and grid layouts.</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Screen Sharing</h3>
              <p className="text-muted-foreground">Share your screen or specific applications for presentations and collaboration.</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <UserPlus className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Friend Management</h3>
              <p className="text-muted-foreground">Easily add friends, manage requests, and see who's online and available to call.</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">In-Call Chat</h3>
              <p className="text-muted-foreground">Send messages during calls with ephemeral chat that disappears after the call.</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-brand-600" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Cross-Platform</h3>
              <p className="text-muted-foreground">Access ConnectSphere from any device - web, iOS, or Android with seamless sync.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Your privacy is our priority
              </h2>
              <p className="text-xl text-muted-foreground">
                ConnectSphere uses end-to-end encryption to ensure your conversations stay private and secure.
              </p>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-6 h-6 text-brand-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">End-to-End Encryption</h3>
                    <p className="text-muted-foreground">All calls and messages are encrypted from your device to theirs.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-6 h-6 text-success mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">No Data Collection</h3>
                    <p className="text-muted-foreground">We don't store your call content or personal conversations.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Star className="w-6 h-6 text-warning mt-1" />
                  <div>
                    <h3 className="font-semibold text-foreground">Open Source Ready</h3>
                    <p className="text-muted-foreground">Built with transparency and security best practices in mind.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-brand-50 to-brand-100 rounded-2xl p-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-foreground">Security Features</h3>
                  <Shield className="w-6 h-6 text-brand-600" />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                    <span className="text-sm font-medium">E2E Encryption</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                    <span className="text-sm font-medium">Secure Authentication</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                    <span className="text-sm font-medium">Private Servers</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg">
                    <span className="text-sm font-medium">Zero Logs Policy</span>
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white">
            Ready to connect like never before?
          </h2>
          <p className="text-xl text-brand-100">
            Join thousands of users already enjoying secure, high-quality video communication.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
              <Link to="/signup">
                Get Started Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white/20 text-white hover:bg-white/10" asChild>
              <Link to="/demo">
                Schedule a Demo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-foreground">ConnectSphere</span>
              </div>
              <p className="text-muted-foreground">
                Secure, high-quality video communication for everyone.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#security" className="hover:text-foreground transition-colors">Security</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><Link to="/demo" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/careers" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/status" className="hover:text-foreground transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 ConnectSphere. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
