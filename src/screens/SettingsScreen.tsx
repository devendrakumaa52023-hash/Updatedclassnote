import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { loadSettings, saveSettings, Settings } from '../storage';
import { DEFAULT_MODEL } from '../shared/lecture';
import { C, g } from '../theme';

const PRESETS: [string, string][] = [
  [DEFAULT_MODEL, 'Default'],
  ['gemini-4-hydrogen', 'Free/Paid multimodal'],
  ['gemini-3.5-flash-lite', 'Fast / low-cost'],
  ['gemini-4-carbon', 'Deep reasoning'],
];

export default function SettingsScreen() {
  const [s, setS] = useState<Settings | null>(null);
  useEffect(() => { loadSettings().then(setS); }, []);
  if (!s) return null;
  const field = (k: keyof Settings, label: string, secure = false) => (
    <>
      <Text style={g.label}>{label}</Text>
      <TextInput style={g.input} value={String(s[k])} secureTextEntry={secure} autoCapitalize="none" autoCorrect={false}
        placeholderTextColor={C.dim} onChangeText={(v) => setS({ ...s, [k]: v })} />
    </>
  );
  return (
    <ScrollView style={g.screen} contentContainerStyle={g.pad} keyboardShouldPersistTaps="handled">
      <Text style={g.h1}>Engine</Text>
      <Text style={g.label}>Gemini model</Text>
      <View style={g.row}>
        {PRESETS.map(([id, note]) => (
          <TouchableOpacity key={id} style={[g.chip, s.model === id && g.chipOn]} onPress={() => setS({ ...s, model: id })}>
            <Text style={[g.chipText, s.model === id && g.chipTextOn]}>{id}</Text>
            <Text style={{ color: s.model === id ? '#e0e7ff' : C.dim, fontSize: 10 }}>{note}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {field('model', 'Custom model ID (editable)')}
      <View style={[g.card, { marginTop: 20, flexDirection: 'row', alignItems: 'center' }]}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={[g.text, { fontWeight: '700' }]}>Direct Device API Key</Text>
          <Text style={g.dim}>Call Gemini straight from this phone. The key is stored only on this device.</Text>
        </View>
        <Switch value={s.mode === 'direct'} onValueChange={(v) => setS({ ...s, mode: v ? 'direct' : 'backend' })} trackColor={{ true: C.primary }} />
      </View>
      {s.mode === 'direct' ? field('apiKey', 'Gemini API key', true) : (<>{field('backendUrl', 'Backend URL (https://…)')}{field('secret', 'API secret (optional)', true)}</>)}
      <TouchableOpacity style={g.btn} onPress={async () => { await saveSettings(s); Alert.alert('Saved', 'Engine settings updated.'); }}><Text style={g.btnText}>Save</Text></TouchableOpacity>
    </ScrollView>
  );
}
