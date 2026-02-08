import React, { useState } from 'react';
import { Heart, Flame, Trophy, Users, Calendar, ChefHat, Dumbbell, Target, Star, MessageCircle, TrendingUp, Award, Zap } from 'lucide-react';

const CouplesFitnessApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState(null);

  // Sample data
  const coupleData = {
    obed: {
      name: 'Obed',
      weeklyGoal: 5,
      completed: 3,
      streak: 12,
      calories: 1850,
      calorieGoal: 2200
    },
    kristina: {
      name: 'Kristina',
      weeklyGoal: 4,
      completed: 4,
      streak: 12,
      calories: 1650,
      calorieGoal: 1900
    }
  };

  const activities = [
    { id: 1, name: 'Morning Hike', type: 'Together', duration: '45 min', calories: 350, difficulty: 'Medium', icon: '🥾' },
    { id: 2, name: 'Couples Yoga', type: 'Together', duration: '30 min', calories: 180, difficulty: 'Easy', icon: '🧘' },
    { id: 3, name: 'Dance Class', type: 'Together', duration: '60 min', calories: 400, difficulty: 'Medium', icon: '💃' },
    { id: 4, name: 'Bike Ride', type: 'Together', duration: '40 min', calories: 320, difficulty: 'Easy', icon: '🚴' },
    { id: 5, name: 'HIIT Workout', type: 'Individual', duration: '25 min', calories: 280, difficulty: 'Hard', icon: '⚡' },
    { id: 6, name: 'Swimming', type: 'Together', duration: '45 min', calories: 400, difficulty: 'Medium', icon: '🏊' }
  ];

  const meals = [
    { id: 1, name: 'Mediterranean Chicken Bowl', prepTime: '25 min', calories: 450, tags: ['High Protein', 'Healthy Fats'], difficulty: 'Easy', image: '🥗' },
    { id: 2, name: 'Teriyaki Salmon & Veggies', prepTime: '30 min', calories: 520, tags: ['Omega-3', 'Low Carb'], difficulty: 'Medium', image: '🐟' },
    { id: 3, name: 'Veggie Quinoa Power Bowl', prepTime: '20 min', calories: 380, tags: ['Vegetarian', 'Fiber Rich'], difficulty: 'Easy', image: '🥙' },
    { id: 4, name: 'Thai Peanut Stir-Fry', prepTime: '35 min', calories: 420, tags: ['Quick Prep', 'Fun to Make'], difficulty: 'Medium', image: '🍜' },
    { id: 5, name: 'Greek Yogurt Parfait', prepTime: '10 min', calories: 280, tags: ['Breakfast', 'Protein'], difficulty: 'Easy', image: '🥣' },
    { id: 6, name: 'Spicy Shrimp Tacos', prepTime: '30 min', calories: 395, tags: ['Date Night', 'Fun to Make'], difficulty: 'Medium', image: '🌮' }
  ];

  const challenges = [
    { id: 1, name: '7-Day Couple Challenge', description: 'Work out together every day this week', progress: 42, goal: 100, reward: '🏆 Golden Hearts Badge' },
    { id: 2, name: 'Healthy Meal Streak', description: 'Cook 10 healthy meals together', progress: 60, goal: 100, reward: '👨‍🍳 Master Chef Badge' },
    { id: 3, name: 'Monthly Active Days', description: 'Both complete 20 active days', progress: 75, goal: 100, reward: '⭐ Power Couple Badge' }
  ];

  const motivationMessages = [
    "You two are crushing it! 💪",
    "Kristina logged a morning run - time to match her energy! 🏃‍♀️",
    "12-day streak together! Keep it going! 🔥",
    "You're both 85% to your weekly goal! Almost there! 🎯"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-8 h-8 fill-white" />
              <h1 className="text-3xl font-bold">FitTogether</h1>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Flame className="w-5 h-5 fill-orange-300" />
                <span className="font-bold">{coupleData.obed.streak} Day Streak!</span>
              </div>
              <div className="flex -space-x-2">
                <div className="w-10 h-10 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center font-bold">O</div>
                <div className="w-10 h-10 bg-pink-400 rounded-full border-2 border-white flex items-center justify-center font-bold">K</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'dashboard', icon: TrendingUp, label: 'Dashboard' },
              { id: 'activities', icon: Dumbbell, label: 'Activities' },
              { id: 'meals', icon: ChefHat, label: 'Meal Plans' },
              { id: 'challenges', icon: Trophy, label: 'Challenges' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-600 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Motivation Banner */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">You're Both Amazing! 🌟</h2>
                  <p className="text-purple-100">12-day streak and counting. Keep inspiring each other!</p>
                </div>
                <Heart className="w-16 h-16 fill-white/20" />
              </div>
            </div>

            {/* Progress Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Obed's Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">O</div>
                    <div>
                      <h3 className="font-bold text-lg">Obed</h3>
                      <p className="text-sm text-gray-500">This Week</p>
                    </div>
                  </div>
                  <Target className="w-6 h-6 text-blue-500" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Weekly Workouts</span>
                      <span className="text-blue-600 font-bold">{coupleData.obed.completed}/{coupleData.obed.weeklyGoal}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${(coupleData.obed.completed / coupleData.obed.weeklyGoal) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Calories Today</span>
                      <span className="text-blue-600 font-bold">{coupleData.obed.calories}/{coupleData.obed.calorieGoal}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-green-600" style={{ width: `${(coupleData.obed.calories / coupleData.obed.calorieGoal) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Kristina's Card */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl">K</div>
                    <div>
                      <h3 className="font-bold text-lg">Kristina</h3>
                      <p className="text-sm text-gray-500">This Week</p>
                    </div>
                  </div>
                  <Star className="w-6 h-6 text-pink-500" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Weekly Workouts</span>
                      <span className="text-pink-600 font-bold">{coupleData.kristina.completed}/{coupleData.kristina.weeklyGoal} ✨</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600" style={{ width: `${(coupleData.kristina.completed / coupleData.kristina.weeklyGoal) * 100}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Calories Today</span>
                      <span className="text-pink-600 font-bold">{coupleData.kristina.calories}/{coupleData.kristina.calorieGoal}</span>
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-green-600" style={{ width: `${(coupleData.kristina.calories / coupleData.kristina.calorieGoal) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation Feed */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-500" />
                Motivation Feed
              </h3>
              <div className="space-y-3">
                {motivationMessages.map((msg, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <Zap className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{msg}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Challenges */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-orange-500" />
                Active Challenges
              </h3>
              <div className="space-y-4">
                {challenges.slice(0, 2).map(challenge => (
                  <div key={challenge.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{challenge.name}</h4>
                        <p className="text-sm text-gray-600">{challenge.description}</p>
                      </div>
                      <span className="text-2xl">{challenge.progress === 100 ? '🏆' : '⭐'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-400 to-pink-500" style={{ width: `${challenge.progress}%` }}></div>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{challenge.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Activity Suggestions</h2>
              <p className="text-gray-600 mb-6">Fun ways to stay active together and separately</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {activities.map(activity => (
                  <div
                    key={activity.id}
                    onClick={() => setSelectedActivity(activity)}
                    className="border-2 border-gray-200 rounded-xl p-5 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{activity.icon}</span>
                        <div>
                          <h3 className="font-bold text-lg">{activity.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            activity.type === 'Together' 
                              ? 'bg-pink-100 text-pink-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {activity.type}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-900">{activity.duration}</div>
                        <div className="text-gray-500 text-xs">Duration</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-900">{activity.calories}</div>
                        <div className="text-gray-500 text-xs">Calories</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="font-semibold text-gray-900">{activity.difficulty}</div>
                        <div className="text-gray-500 text-xs">Level</div>
                      </div>
                    </div>
                    {selectedActivity?.id === activity.id && (
                      <button className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow">
                        Start Activity Together 💪
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Meal Planning & Recipes</h2>
              <p className="text-gray-600 mb-6">Delicious, healthy meals to cook together</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {meals.map(meal => (
                  <div
                    key={meal.id}
                    onClick={() => setSelectedMeal(meal)}
                    className="border-2 border-gray-200 rounded-xl p-5 hover:border-orange-400 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <span className="text-5xl">{meal.image}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{meal.name}</h3>
                        <div className="flex gap-2 flex-wrap mb-2">
                          {meal.tags.map((tag, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>⏱️ {meal.prepTime}</span>
                          <span>🔥 {meal.calories} cal</span>
                          <span>📊 {meal.difficulty}</span>
                        </div>
                      </div>
                    </div>
                    {selectedMeal?.id === meal.id && (
                      <button className="w-full mt-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow">
                        Cook Together Tonight 👨‍🍳
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Meal Planning Calendar */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                This Week's Meal Plan
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <div key={day} className="text-center p-3 border-2 border-dashed border-gray-200 rounded-lg hover:border-orange-300 cursor-pointer">
                    <div className="font-semibold text-sm text-gray-700 mb-1">{day}</div>
                    <div className="text-2xl">{idx < 3 ? '✅' : '📝'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-2">Couple Challenges</h2>
              <p className="text-gray-600 mb-6">Achieve goals together and earn rewards</p>
              
              <div className="space-y-4">
                {challenges.map(challenge => (
                  <div key={challenge.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-purple-400 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-xl mb-1">{challenge.name}</h3>
                        <p className="text-gray-600">{challenge.description}</p>
                      </div>
                      <Award className="w-8 h-8 text-yellow-500" />
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium">Progress</span>
                        <span className="font-bold text-purple-600">{challenge.progress}%</span>
                      </div>
                      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 transition-all duration-500"
                          style={{ width: `${challenge.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Reward:</span>
                      <span className="font-bold text-yellow-700">{challenge.reward}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Earned Badges */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-bold text-lg mb-4">Earned Badges 🏆</h3>
              <div className="grid grid-cols-4 gap-4">
                {['🔥', '💪', '❤️', '⭐', '👟', '🥗', '🎯', '💑'].map((badge, idx) => (
                  <div key={idx} className="text-center p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                    <div className="text-4xl mb-2">{badge}</div>
                    <div className="text-xs font-medium text-gray-700">Week {idx + 1}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouplesFitnessApp;