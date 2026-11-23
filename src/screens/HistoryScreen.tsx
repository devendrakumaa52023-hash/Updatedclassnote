import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { deleteAudioOnly, deleteLecture, loadLectures, SavedLecture } from '../storage';
import { C, g } from '../theme';

export default function HistoryScreen({ onOpen }: { onOpen: (l: SavedLecture) => void }) {
  const [items, setItems] = useState<SavedLecture[]>([]);
  const refresh = useCallback(() => { loadLectures().then(setItems); }, []);
  useEffect(refresh, []);

  const manage = (item: SavedLecture) => {
    const buttons: any[] = [{ text: 'Cancel', style: 'cancel' }];
    if (item.audioUri) buttons.push({ text: 'Delete audio only', onPress: async () => { await deleteAudioOnly(item.id); refresh(); } });
    buttons.push({ text: 'Delete notes & audio', style: 'destructive', onPress: async () => { await deleteLecture(item.id); refresh(); } });
    Alert.alert(item.result.handout.title, 'Free storage or remove this lecture?', buttons);
  };

  return (
    <View style={g.screen}>
      <FlatList
        contentContainerStyle={g.pad}
        data={items}
        keyExtractor={(i) => i.id}
        ListHeaderComponent={<Text style={[g.h1, { marginBottom: 12 }]}>Library</Text>}
        ListEmptyComponent={<Text style={g.dim}>No lectures yet. Record your first class in Studio.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={g.card} onPress={() => onOpen(item)} onLongPress={() => manage(item)}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={[g.text, { fontWeight: '800', flex: 1 }]}>{item.result.handout.title}</Text>
              <TouchableOpacity onPress={() => manage(item)} hitSlop={10}><Text style={{ color: C.dim, fontSize: 20 }}>⋯</Text></TouchableOpacity>
            </View>
            <Text style={g.dim}>{[item.meta.grade, item.meta.subject, item.meta.batchTag].filter(Boolean).join(' • ')}</Text>
            <Text style={g.dim}>{new Date(item.createdAt).toLocaleString()}{item.audioUri ? '  🎧 audio saved' : ''}</Text>
            <Text style={{ color: C.cyan, fontSize: 13, marginTop: 6, fontWeight: '700' }}>
              {item.result.worksheet.classroom_questions.length} Class Qs • {item.result.worksheet.mcqs.length + item.result.worksheet.short_answer.length} Practice Qs
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
