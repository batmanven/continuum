import { Activity, Plus, FileUp, Brain, DollarSign, TrendingUp, TrendingDown, Minus, Calendar, Star, FileText, Heart, Moon, User, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useProfile } from "@/contexts/ProfileContext";
import { useDashboardData } from "@/hooks/useDashboardData";

const Dashboard = () => {
  const { user } = useSupabaseAuth();
  const { activeProfile } = useProfile();
  const userName = activeProfile.name || user?.user_metadata?.name || user?.email || "User";
  const { data, loading, error } = useDashboardData();

  const getMoodIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'health': return <Heart className="h-3 w-3" />;
      case 'bill': return <FileText className="h-3 w-3" />;
      case 'summary': return <Brain className="h-3 w-3" />;
      default: return <Activity className="h-3 w-3" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'health': return 'bg-blue-100 text-blue-800';
      case 'bill': return 'bg-green-100 text-green-800';
      case 'summary': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center py-12">
          <Activity className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Unable to load dashboard</h3>
          <p className="text-sm text-muted-foreground">{error || 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  const isProfileComplete = user?.user_metadata?.name && 
                             user?.user_metadata?.gender && 
                             user?.user_metadata?.date_of_birth && 
                             user?.user_metadata?.phone && 
                             user?.user_metadata?.blood_type;

  const missingFields = [
    { key: 'name', label: 'Full Name', val: user?.user_metadata?.name },
    { key: 'gender', label: 'Gender', val: user?.user_metadata?.gender },
    { key: 'dob', label: 'Date of Birth', val: user?.user_metadata?.date_of_birth },
    { key: 'phone', label: 'Phone', val: user?.user_metadata?.phone },
    { key: 'blood', label: 'Blood Group', val: user?.user_metadata?.blood_type },
  ].filter(f => !f.val);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="opacity-0 animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">
            Welcome back, {userName}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Your clinical health summary as of {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      {!isProfileComplete && (
        <Card id="tour-dashboard-completion" className="border-primary/20 bg-primary/5 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <User className="h-24 w-24 -rotate-12" />
          </div>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Shield className="h-8 w-8" />
              </div>
              <div className="flex-1 text-center md:text-left space-y-2">
                <h3 className="font-bold text-lg">Secure Your Medical Identity</h3>
                <p className="text-sm text-muted-foreground max-w-xl">
                  Your emergency profile is missing <span className="text-primary font-bold">{missingFields.length} critical fields</span> ({missingFields.map(f => f.label).join(', ')}). 
                  Completing this ensures first responders have accurate info in a crisis.
                </p>
              </div>
              <Link to="/app/settings">
                <Button variant="hero" className="rounded-xl px-8 shadow-lg shadow-primary/20">
                  Complete Profile
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Health Entries */}
        <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Health Entries
              </h3>
            </div>
            <p className="font-display text-2xl font-semibold text-foreground">
              {data.healthStats.totalEntries}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {data.healthStats.thisWeekEntries} this week
            </p>
            {data.healthStats.recentSymptoms.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">Recent:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.healthStats.recentSymptoms.slice(0, 3).map((symptom, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {symptom}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mood Trend */}
        <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "150ms" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Mood Trend
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {getMoodIcon(data.healthStats.moodTrend)}
              <p className="font-display text-2xl font-semibold text-foreground capitalize">
                {data.healthStats.moodTrend}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>

        {/* Sleep Quality */}
        <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Sleep Quality
              </h3>
            </div>
            <p className="font-display text-2xl font-semibold text-foreground">
              {data.healthStats.avgSleepHours}h
            </p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {data.healthStats.avgSleepQuality} average
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "250ms" }}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-medium text-muted-foreground">
                Expenses
              </h3>
            </div>
            <p className="font-display text-2xl font-semibold text-foreground">
              ₹{data.financialStats.totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{data.financialStats.thisMonthExpenses.toLocaleString()} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Recent Activity
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity. Start by adding health entries or uploading bills!
                  </p>
                ) : (
                  data.recentActivity.map((activity, i) => (
                    <div key={activity.id} className="flex items-start gap-3 group">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getActivityColor(activity.type)}`}
                          >
                            {getActivityIcon(activity.type)}
                            <span className="ml-1">{activity.title}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">{activity.date}</span>
                        </div>
                        <p className="text-sm text-foreground">{activity.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights & Quick Actions */}
        <div className="space-y-6">
          {/* Latest Insights */}
          {data.insightsStats.latestSummary && (
            <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "350ms" }}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Latest Insights
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    {data.insightsStats.latestSummary.summary.length > 100 
                      ? data.insightsStats.latestSummary.summary.substring(0, 100) + '...'
                      : data.insightsStats.latestSummary.summary
                    }
                  </p>
                  {data.insightsStats.latestSummary.insights.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Key Insights:</p>
                      {data.insightsStats.latestSummary.insights.slice(0, 2).map((insight, i) => (
                        <p key={i} className="text-xs bg-blue-50 text-blue-800 p-2 rounded">
                          💡 {insight.length > 60 ? insight.substring(0, 60) + '...' : insight}
                        </p>
                      ))}
                    </div>
                  )}
                  <Link to="/app/doctor-summaries">
                    <Button variant="outline" size="sm" className="w-full">
                      View All Summaries
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Quick Actions
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="hero" size="sm" asChild className="w-full">
                  <Link to="/app/health-memory" className="gap-2">
                    <Plus className="h-3.5 w-3.5" /> Add Health Entry
                  </Link>
                </Button>
                <Button variant="hero-outline" size="sm" asChild className="w-full">
                  <Link to="/app/bill-explainer" className="gap-2">
                    <FileUp className="h-3.5 w-3.5" /> Upload Bill
                  </Link>
                </Button>
                {data.healthStats.totalEntries > 0 && (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link to="/app/health-memory" className="gap-2">
                      <Brain className="h-3.5 w-3.5" /> Generate Summary
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Top Categories */}
          {data.financialStats.topCategories.length > 0 && (
            <Card className="opacity-0 animate-fade-in" style={{ animationDelay: "450ms" }}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Top Categories
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.financialStats.topCategories.map((category, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-foreground">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">₹{category.amount.toLocaleString()}</span>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(category.percentage)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
