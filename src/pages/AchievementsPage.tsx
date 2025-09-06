
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Trophy, Star, TrendingUp } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { format } from 'date-fns';

const AchievementsPage = () => {
  const { user } = useAppContext();

  const achievementIcons: Record<string, React.ReactNode> = {
    'trophy': <Trophy className="h-6 w-6" />,
    'award': <Award className="h-6 w-6" />,
    'star': <Star className="h-6 w-6" />,
    'trending-up': <TrendingUp className="h-6 w-6" />
  };

  // Simulate upcoming achievements
  const upcomingAchievements = [
    {
      name: "Budget Master",
      description: "Stay within budget for 3 consecutive months",
      progress: 66, // 66%
      icon: 'star'
    },
    {
      name: "Saving Pro",
      description: "Save $5,000 in your accounts",
      progress: 45, // 45%
      icon: 'trending-up'
    },
    {
      name: "Goal Getter",
      description: "Complete 5 financial goals",
      progress: 20, // 20%
      icon: 'trophy'
    }
  ];

  return (
    <MainLayout title="Achievements">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Your Financial Achievements</h2>
          <p className="text-muted-foreground">Track your progress and celebrate your financial milestones</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earned Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-metacash-blue" />
                Earned Achievements
              </CardTitle>
              <CardDescription>
                Achievements you've already unlocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.achievements.length > 0 ? (
                <div className="space-y-4">
                  {user.achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-4 p-3 border rounded-lg bg-slate-50">
                      <div className="h-12 w-12 rounded-full bg-metacash-teal/20 flex items-center justify-center text-metacash-blue">
                        {achievementIcons[achievement.icon] || <Award className="h-6 w-6" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                      <div className="text-sm text-muted-foreground text-right">
                        {format(new Date(achievement.dateEarned), 'MMM d, yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Trophy className="h-16 w-16 mx-auto text-muted-foreground opacity-30" />
                  <p className="mt-4 text-muted-foreground">
                    You haven't earned any achievements yet. Keep using MetaCash to unlock achievements!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-metacash-blue" />
                Upcoming Achievements
              </CardTitle>
              <CardDescription>
                Achievements you're working towards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAchievements.map((achievement, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-metacash-gray">
                          {achievementIcons[achievement.icon] || <Award className="h-5 w-5" />}
                        </div>
                        <div>
                          <h4 className="font-medium">{achievement.name}</h4>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                      <div className="text-sm font-medium">{achievement.progress}%</div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-metacash-blue"
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Achievement Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{user.achievements.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Achievement Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">Beginner</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Next Milestone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">3 more</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default AchievementsPage;
