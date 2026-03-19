import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { fetchDailyQuote } from '../../../services/quoteService';

const DailyWisdom = () => {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useState(new Animated.Value(1))[0];

  const loadNewQuote = async () => {
    setLoading(true);
    const newQuote = await fetchDailyQuote();
    setQuote(newQuote);
    setLoading(false);
  };

  useEffect(() => {
    loadNewQuote();
    
    // Change quote every 10 seconds
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        loadNewQuote();
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  if (loading || !quote) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color="#4CAF50" />
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Text style={styles.quoteTe}>{quote.te}</Text>
      <Text style={styles.quoteEn}>"{quote.en}"</Text>
      {quote.author && quote.author !== 'Anonymous' && (
        <Text style={styles.author}>— {quote.author}</Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 20,
    minHeight: 100,
  },
  quoteTe: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Noto Sans Telugu',
  },
  quoteEn: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  author: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});

export default DailyWisdom;