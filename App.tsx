import React, { useState } from 'react';
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RecordScreen from './src/screens/RecordScreen';
import ResultScreen from './src/screens/ResultScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { SavedLecture } from './src/storage';
import { C, g, glow } from './src/theme';

const TABS = [['studio', '🎙 Studio'], ['library', '📚 Library'], ['engine', '⚡ Engine']] as const;
type Tab = (typeof TABS)[number][0];

export default function App() {
  const [tab, setTab] = useState<Tab>('studio');
  const [open, setOpen] = useState<SavedLecture | null>(null);
  return (
    <SafeAreaView style={[g.screen, { paddingTop: 28 }]}>
      <StatusBar style="light" />
      <View style={{ flex: 1 }}>
        {open ? <ResultScreen lecture={open} onBack={() => setOpen(null)} />
          : tab === 'studio' ? <RecordScreen onDone={setOpen} />
          : tab === 'library' ? <HistoryScreen onOpen={setOpen} />
          : <SettingsScreen />}
      </View>
      {!open && (
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: 18, flexDirection: 'row', backgroundColor: C.surface, borderRadius: 30, padding: 5, borderWidth: 1, borderColor: C.line, elevation: 10 }}>
          {TABS.map(([k, label]) => (
            <TouchableOpacity key={k} style={[{ flex: 1, paddingVertical: 12, borderRadius: 25 }, tab === k && { backgroundColor: C.primary, ...glow }]} onPress={() => setTab(k)}>
              <Text style={{ textAlign: 'center', color: tab === k ? '#fff' : C.dim, fontWeight: '800', fontSize: 13 }}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}
