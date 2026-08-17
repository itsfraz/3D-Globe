import { useState, useEffect, useMemo } from 'react';

const FAVORITES_KEY = 'world-globe-ai-favorites';
const EXPLORED_KEY = 'world-globe-ai-explored';
const ACTIVITY_KEY = 'world-globe-ai-activity';

export function useUserJourney() {
  const [favorites, setFavorites] = useState([]);
  const [explored, setExplored] = useState([]);
  const [activity, setActivity] = useState([]);

  // Load from local storage
  useEffect(() => {
    try {
      const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY)) || [];
      const expl = JSON.parse(localStorage.getItem(EXPLORED_KEY)) || [];
      const act = JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || [];
      
      setFavorites(favs);
      setExplored(expl);
      setActivity(act);
    } catch (e) {
      console.error("Failed to parse journey data from localStorage", e);
    }
  }, []);

  const saveFavorites = (newFavs) => {
    setFavorites(newFavs);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavs));
  };

  const saveExplored = (newExpl) => {
    setExplored(newExpl);
    localStorage.setItem(EXPLORED_KEY, JSON.stringify(newExpl));
  };

  const saveActivity = (newAct) => {
    setActivity(newAct);
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(newAct));
  };

  const toggleFavorite = (country) => {
    const isFav = favorites.some(f => f.name === country.name);
    if (isFav) {
      saveFavorites(favorites.filter(f => f.name !== country.name));
    } else {
      saveFavorites([{...country, savedAt: Date.now()}, ...favorites]);
    }
  };

  const isFavorite = (countryName) => {
    return favorites.some(f => f.name === countryName);
  };

  const removeFavorite = (countryName) => {
    saveFavorites(favorites.filter(f => f.name !== countryName));
  };

  const clearFavorites = () => {
    saveFavorites([]);
  };

  const addExploration = (country) => {
    if (!country || !country.name) return;
    
    // Update activity (Streak tracking)
    const today = new Date().toISOString().split('T')[0];
    if (!activity.includes(today)) {
      saveActivity([...activity, today]);
    }

    // Update explored (History tracking)
    // Remove if already exists so we can bump it to the front
    let updatedExplored = explored.filter(e => e.name !== country.name);
    updatedExplored = [{ ...country, exploredAt: Date.now() }, ...updatedExplored];
    saveExplored(updatedExplored);
  };

  // Compute Stats
  const stats = useMemo(() => {
    const totalExplored = explored.length;
    const totalFavorites = favorites.length;
    
    // Explored this week
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const exploredThisWeek = explored.filter(e => e.exploredAt && e.exploredAt > oneWeekAgo).length;

    // Unique regions
    const regions = new Set(explored.map(e => e.region).filter(Boolean));
    const uniqueRegions = regions.size;

    return {
      totalExplored,
      totalFavorites,
      exploredThisWeek,
      uniqueRegions
    };
  }, [explored, favorites]);

  // Compute Daily Streak
  const streak = useMemo(() => {
    if (activity.length === 0) return 0;
    
    // Sort dates descending
    const sortedDates = [...activity].sort((a, b) => new Date(b) - new Date(a));
    
    let currentStreak = 0;
    let checkDate = new Date();
    
    // Timezone safe extraction of YYYY-MM-DD
    const todayStr = checkDate.toISOString().split('T')[0];
    checkDate.setDate(checkDate.getDate() - 1);
    const yesterdayStr = checkDate.toISOString().split('T')[0];

    // If latest activity is not today and not yesterday, streak is 0
    if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
      return 0;
    }

    let nextExpectedStr = sortedDates[0];
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (sortedDates[i] === nextExpectedStr) {
        currentStreak++;
        const d = new Date(nextExpectedStr);
        d.setDate(d.getDate() - 1);
        nextExpectedStr = d.toISOString().split('T')[0];
      } else {
        break;
      }
    }

    return currentStreak;
  }, [activity]);

  // Compute Achievements
  const achievements = useMemo(() => {
    return [
      {
        id: 'first_discovery',
        title: 'First Discovery',
        description: 'Explore your first country',
        unlocked: stats.totalExplored >= 1
      },
      {
        id: 'explorer_5',
        title: 'Novice Explorer',
        description: 'Explore 5 countries',
        unlocked: stats.totalExplored >= 5
      },
      {
        id: 'explorer_10',
        title: 'Seasoned Traveler',
        description: 'Explore 10 countries',
        unlocked: stats.totalExplored >= 10
      },
      {
        id: 'explorer_25',
        title: 'Globetrotter',
        description: 'Explore 25 countries',
        unlocked: stats.totalExplored >= 25
      },
      {
        id: 'region_5',
        title: 'World Citizen',
        description: 'Explore 5 distinct regions',
        unlocked: stats.uniqueRegions >= 5
      },
      {
        id: 'favorites_10',
        title: 'Curator',
        description: 'Save 10 favorites',
        unlocked: stats.totalFavorites >= 10
      }
    ];
  }, [stats]);

  // Recent history (max 10)
  const recentHistory = useMemo(() => {
    return explored.slice(0, 10);
  }, [explored]);

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    removeFavorite,
    clearFavorites,
    addExploration,
    recentHistory,
    stats,
    streak,
    achievements
  };
}
