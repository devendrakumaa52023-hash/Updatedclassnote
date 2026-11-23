import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, PermissionsAndroid, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { processLecture } from '../api';
import { loadSettings, saveLecture, SavedLecture } from '../storage';
import { DEFAULT_MODEL, Meta } from '../shared/lecture';
import { C, g, glow } from '../theme';

const GRADES = ['Class 10', 'Class 11', 'Class 12', 'JEE', 'NEET'];
const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'Science', 'Other'];
const OPTIONS: any = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: '.m4a', sampleRate: 16000, numberOfChannels: 1, bitRate: 48000, isMeteringEnabled: true,
  android: { extension: '.m4a', outputFormat: 'mpeg4', audioEncoder: 'aac' },
};

const Chips = <T extends string | number>({ items, value, onPick }: { items: readonly T[]; value: T; onPick: (v: T) => void }) => (
  <View style={g.row}>
    {items.map((i) => (
      <TouchableOpacity key={String(i)} style={[g.chip, value === i && g.chipOn]} onPress={() => onPick(i)}>
        <Text style={[g.chipText, value === i && g.chipTextOn]}>{String(i)}</Text>
      </TouchableOpacity>
    ))}
  </View>
);
const fmt = (ms: number) => {
  const s = Math.floor((ms || 0) / 1000);
  return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':');
};

export default function RecordScreen({ onDone }: { onDone: (l: SavedLecture) => void }) {
  const [meta, setMeta] = useState<Meta>({ grade: 'Class 10', subject: 'Physics', language: 'Hinglish', extraQuestions: 10, batchTag: '', chapter: '' });
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [phase, setPhase] = useState<'setup' | 'recording' | 'processing' | 'error'>('setup');
  const [paused, setPaused] = useState(false);
  const [stage, setStage] = useState('');
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState<{ id: string; uri: string } | null>(null);
  const recorder = useAudioRecorder(OPTIONS);
  const st = useAudioRecorderState(recorder, 250);
  const level = useRef(new Animated.Value(0.2)).current;

  useEffect(() => { loadSettings().then((s) => setModel(s.model)); }, []);
  useEffect(() => {
    const db = typeof st.metering === 'number' ? st.metering : -60;
    Animated.timing(level, { toValue: paused ? 0.05 : Math.max(0.05, Math.min(1, (db + 60) / 60)), duration: 220, useNativeDriver: true }).start();
  }, [st.metering, paused]);

  const badge = model.toUpperCase().replace('GEMINI-', 'GEMINI ');

  async function start() {
    const p = await requestRecordingPermissionsAsync();
    if (!p.granted) return Alert.alert('Microphone permission needed', 'Allow microphone access to record the lecture.');
    if (Platform.OS === 'android' && Platform.Version >= 33) await PermissionsAndroid.request('android.permission.POST_NOTIFICATIONS' as any);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true, shouldPlayInBackground: true, allowsBackgroundRecording: true } as any);
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPaused(false); setPhase('recording');
    } catch (e: any) { Alert.alert('Could not start recording', e.message); }
  }
  const togglePause = () => { if (paused) recorder.record(); else recorder.pause(); setPaused(!paused); };

  async function finish() {
    await recorder.stop();
    const src = recorder.uri;
    if (!src) { setErr('No audio was recorded.'); return setPhase('error'); }
    const id = String(Date.now());
    const dir = FileSystem.documentDirectory + 'lectures/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
    const dest = `${dir}${id}.m4a`;
    await FileSystem.copyAsync({ from: src, to: dest });
    setSaved({ id, uri: dest });
    run(id, dest);
  }

  async function run(id: string, uri: string) {
    setPhase('processing'); setErr('');
    try {
      const settings = await loadSettings();
      setModel(settings.model);
      const result = await processLecture(uri, meta, settings, setStage);
      const entry: SavedLecture = { id, createdAt: Date.now(), meta, result, audioUri: uri };
      await saveLecture(entry);
      setPhase('setup'); setSaved(null);
      onDone(entry);
    } catch (e: any) { setErr(e.message || String(e)); setPhase('error'); }
  }

  const Header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View>
        <Text style={g.h1}>ClassNote AI</Text>
        <Text style={g.dim}>Pocket lecture → notes, worksheet & transcript</Text>
      </View>
      <View style={{ borderWidth: 1, borderColor: C.primary, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5, ...glow }}>
        <Text style={{ color: C.cyan, fontSize: 11, fontWeight: '800' }}>{badge}</Text>
      </View>
    </View>
  );

  if (phase === 'recording') {
    return (
      <View style={[g.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <Text style={g.dim}>{[meta.grade, meta.subject, meta.batchTag, meta.chapter].filter(Boolean).join(' • ')}</Text>
        <View style={{ width: 260, height: 260, alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
          {[0, 1, 2].map((i) => (
            <Animated.View key={i} style={{
              position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2,
              borderColor: paused ? C.dim : i === 0 ? C.primary : C.cyan, opacity: 0.6 - i * 0.18,
              transform: [{ scale: level.interpolate({ inputRange: [0, 1], outputRange: [1 + i * 0.25, 1.35 + i * 0.4] }) }],
            }} />
          ))}
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: paused ? C.card : C.primary, alignItems: 'center', justifyContent: 'center', ...(paused ? {} : glow) }}>
            <Text style={{ fontSize: 38 }}>🎙</Text>
          </View>
        </View>
        <Text style={{ color: C.text, fontSize: 50, fontWeight: '800', fontVariant: ['tabular-nums'] }}>{fmt(st.durationMillis)}</Text>
        <View style={{ marginTop: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: paused ? C.card : '#7f1d1d' }}>
          <Text style={{ color: paused ? C.warn : '#fecaca', fontWeight: '800', fontSize: 12 }}>{paused ? '● PAUSED' : '● ON AIR'}</Text>
        </View>
        <Text style={[g.dim, { marginTop: 14, textAlign: 'center' }]}>Pocket mode: you can lock the screen and slip the phone into your shirt pocket, mic facing out.</Text>
        <TouchableOpacity style={[g.btn, g.btn2, { width: '100%' }]} onPress={togglePause}><Text style={[g.btnText, { color: C.text }]}>{paused ? '▶ Resume' : '⏸ Pause'}</Text></TouchableOpacity>
        <TouchableOpacity style={[g.btn, { width: '100%' }]} onPress={finish}><Text style={g.btnText}>Finish & Generate Notes</Text></TouchableOpacity>
      </View>
    );
  }
  if (phase === 'processing') {
    return (
      <View style={[g.screen, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={[g.text, { marginTop: 16, textAlign: 'center' }]}>{stage || 'Working…'}</Text>
        <Text style={[g.dim, { marginTop: 8, textAlign: 'center' }]}>Long lectures can take a few minutes. Your audio is safely stored on this phone.</Text>
      </View>
    );
  }
  if (phase === 'error') {
    return (
      <View style={[g.screen, { justifyContent: 'center', padding: 24 }]}>
        <Text style={[g.h1, { color: C.bad }]}>Processing failed</Text>
        <Text style={[g.text, { marginTop: 8 }]}>{err}</Text>
        <Text style={[g.dim, { marginTop: 8 }]}>Your recording is saved on the device.</Text>
        {saved && <TouchableOpacity style={g.btn} onPress={() => run(saved.id, saved.uri)}><Text style={g.btnText}>↻ Retry</Text></TouchableOpacity>}
        <TouchableOpacity style={[g.btn, g.btn2]} onPress={() => { setPhase('setup'); setSaved(null); }}><Text style={[g.btnText, { color: C.text }]}>Back</Text></TouchableOpacity>
      </View>
    );
  }
  return (
    <ScrollView style={g.screen} contentContainerStyle={g.pad} keyboardShouldPersistTaps="handled">
      {Header}
      <Text style={g.label}>Grade / Exam</Text><Chips items={GRADES} value={meta.grade} onPick={(grade) => setMeta({ ...meta, grade })} />
      <Text style={g.label}>Subject</Text><Chips items={SUBJECTS} value={meta.subject} onPick={(subject) => setMeta({ ...meta, subject })} />
      <Text style={g.label}>Language</Text><Chips items={['English', 'Hinglish'] as const} value={meta.language} onPick={(language) => setMeta({ ...meta, language })} />
      <Text style={g.label}>Extra DPP Questions</Text><Chips items={[5, 10, 15] as const} value={meta.extraQuestions} onPick={(extraQuestions) => setMeta({ ...meta, extraQuestions })} />
      <Text style={g.label}>Batch Tag (optional)</Text>
      <TextInput style={g.input} placeholder="e.g. Nurture A1" placeholderTextColor={C.dim} value={meta.batchTag} onChangeText={(batchTag) => setMeta({ ...meta, batchTag })} />
      <Text style={g.label}>Chapter / Topic (optional)</Text>
      <TextInput style={g.input} placeholder="e.g. Rotational Motion" placeholderTextColor={C.dim} value={meta.chapter} onChangeText={(chapter) => setMeta({ ...meta, chapter })} />
      <TouchableOpacity style={g.btn} onPress={start}><Text style={g.btnText}>🎙 Start Class</Text></TouchableOpacity>
    </ScrollView>
  );
}
