import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { LevelUpAPI } from '../api/client';
import type { Task, UserStats, Stat } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

export default function DashboardScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const api = new LevelUpAPI(API_BASE_URL, () => {
    // TODO: Get token from secure storage
    return null;
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
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
    >
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{task.title}</Text>
        <View style={[styles.taskType, { backgroundColor: getTaskTypeColor(task.type) }]}>
          <Text style={styles.taskTypeText}>{task.type}</Text>
        </View>
      </View>
      <Text style={styles.taskDescription}>{task.description}</Text>
      <View style={styles.taskFooter}>
        <Text style={styles.taskXP}>+{task.xp} XP</Text>
        <Text style={styles.taskDifficulty}>{task.difficulty}</Text>
      </View>
    </TouchableOpacity>
  );

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'main': return '#ff6b6b';
      case 'daily': return '#4ecdc4';
      case 'side': return '#ffe66d';
      default: return '#888';
    }
  };

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
        {userStats && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Lv.{userStats.level}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.content}>
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
          </View>
        )}

        {/* Tasks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>任务</Text>
          {tasks.map(renderTask)}
        </View>
      </ScrollView>

      {/* Add Task Button */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  taskCard: {
    backgroundColor: '#0f2642',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  taskCompleted: {
    opacity: 0.6,
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
  taskType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  taskTypeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#00d4ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 24,
    color: '#000',
    fontWeight: 'bold',
  },
});
