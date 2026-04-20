import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SDK Types
interface Task {
  id: string;
  title: string;
  description?: string;
  type: 'main' | 'daily' | 'side';
  difficulty: 'easy' | 'medium' | 'hard';
  xp: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserStats {
  level: number;
  currentXP: number;
  maxXP: number;
  totalPower: number;
  achievementsCount: number;
  streakDays: number;
}

interface Stat {
  name: string;
  value: number;
  maxValue: number;
  icon: string;
  color: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const API_BASE_URL = 'http://localhost:3000/api';

// Simple API client for React Native
class LevelUpAPI {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('accessToken');
  }

  private async request<T>(endpoint: string, options: any = {}): Promise<ApiResponse<T>> {
    try {
      const token = await this.getToken();
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      const data = await response.json();
      return data;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getTasks(): Promise<ApiResponse<Task[]>> {
    return this.request('/tasks');
  }

  async completeTask(id: string): Promise<ApiResponse<Task>> {
    return this.request('/tasks', {
      method: 'PUT',
      body: JSON.stringify({ id, updates: { completed: true, completedAt: new Date().toISOString() } }),
    });
  }

  async getStats(): Promise<ApiResponse<{ userStats: UserStats; stats: Stat[] }>> {
    return this.request('/stats');
  }
}

interface DashboardScreenProps {
  onLogout: () => void;
}

export default function DashboardScreen({ onLogout }: DashboardScreenProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const api = new LevelUpAPI(API_BASE_URL);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, statsRes] = await Promise.all([
        api.getTasks(),
        api.getStats(),
      ]);

      if (tasksRes.success) {
        setTasks(tasksRes.data || []);
      }

      if (statsRes.success) {
        setStats(statsRes.data?.stats || []);
        setUserStats(statsRes.data?.userStats || null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCompleteTask = async (taskId: string) => {
    const result = await api.completeTask(taskId);
    if (result.success) {
      loadData();
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'main': return '#ff6b6b';
      case 'daily': return '#4ecdc4';
      case 'side': return '#ffe66d';
      default: return '#888';
    }
  };

  const renderStatBar = (stat: Stat) => {
    const percentage = (stat.value / stat.maxValue) * 100;
    return (
      <View key={stat.name} style={styles.statItem}>
        <View style={styles.statHeader}>
          <Text style={styles.statIcon}>{stat.icon}</Text>
          <Text style={styles.statName}>{stat.name}</Text>
          <Text style={styles.statValue}>{stat.value}</Text>
        </View>
        <View style={styles.statBar}>
          <View
            style={[
              styles.statBarFill,
              { width: `${percentage}%`, backgroundColor: stat.color },
            ]}
          />
        </View>
      </View>
    );
  };

  const renderTask = (task: Task) => (
    <TouchableOpacity
      key={task.id}
      style={[styles.taskCard, task.completed && styles.taskCompleted]}
      onPress={() => !task.completed && handleCompleteTask(task.id)}
    >
      <View style={styles.taskHeader}>
        <Text style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
          {task.title}
        </Text>
        <View style={[styles.taskType, { backgroundColor: getTaskTypeColor(task.type) }]}>
          <Text style={styles.taskTypeText}>{task.type.toUpperCase()}</Text>
        </View>
      </View>
      {task.description && (
        <Text style={styles.taskDescription}>{task.description}</Text>
      )}
      <View style={styles.taskFooter}>
        <Text style={styles.taskXP}>+{task.xp} XP</Text>
        <Text style={styles.taskDifficulty}>{task.difficulty}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1628" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LevelUp</Text>
        <View style={styles.headerRight}>
          {userStats && (
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>Lv.{userStats.level}</Text>
            </View>
          )}
          <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>退出</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />
        }
      >
        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>属性</Text>
          <View style={styles.statsContainer}>
            {stats.map(renderStatBar)}
          </View>
        </View>

        {/* XP Progress */}
        {userStats && (
          <View style={styles.xpContainer}>
            <View style={styles.xpHeader}>
              <Text style={styles.xpText}>XP: {userStats.currentXP} / {userStats.maxXP}</Text>
              <Text style={styles.xpPercent}>
                {Math.round((userStats.currentXP / userStats.maxXP) * 100)}%
              </Text>
            </View>
            <View style={styles.xpBar}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${(userStats.currentXP / userStats.maxXP) * 100}%` },
                ]}
              />
            </View>
            <View style={styles.xpFooter}>
              <Text style={styles.xpFooterText}>🔥 连续 {userStats.streakDays} 天</Text>
              <Text style={styles.xpFooterText}>⚡ 战力 {userStats.totalPower}</Text>
              <Text style={styles.xpFooterText}>🏆 成就 {userStats.achievementsCount}</Text>
            </View>
          </View>
        )}

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>任务 (点击完成)</Text>
          {tasks.map(renderTask)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0f2642',
    borderBottomWidth: 1,
    borderBottomColor: '#1e3a5f',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  levelBadge: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    color: '#000',
    fontWeight: 'bold',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  logoutText: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  statsContainer: {
    backgroundColor: '#0f2642',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  statItem: {
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  statName: {
    color: '#fff',
    flex: 1,
  },
  statValue: {
    color: '#00d4ff',
    fontWeight: 'bold',
  },
  statBar: {
    height: 8,
    backgroundColor: '#1e3a5f',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  xpContainer: {
    backgroundColor: '#0f2642',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  xpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpText: {
    color: '#fff',
  },
  xpPercent: {
    color: '#00d4ff',
  },
  xpBar: {
    height: 12,
    backgroundColor: '#1e3a5f',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#00d4ff',
    borderRadius: 6,
  },
  xpFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  xpFooterText: {
    color: '#888',
    fontSize: 12,
  },
  taskCard: {
    backgroundColor: '#0f2642',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  taskCompleted: {
    opacity: 0.5,
    backgroundColor: '#1a3a5f',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  taskType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  taskTypeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskDescription: {
    color: '#888',
    marginBottom: 8,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  taskXP: {
    color: '#00d4ff',
    fontWeight: 'bold',
  },
  taskDifficulty: {
    color: '#888',
    textTransform: 'capitalize',
  },
});
