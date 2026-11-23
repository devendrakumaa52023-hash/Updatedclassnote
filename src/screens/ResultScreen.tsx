import React, { useState } from 'react';
import { Alert, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { exportPdf } from '../pdf';
import { correctIndex } from '../shared/lecture';
import { SavedLecture } from '../storage';
import { C, g, glow } from '../theme';

const TABS = ['Handout', 'Worksheet', 'Transcript'];

export default function ResultScreen({ lecture, onBack }: { lecture: SavedLecture; onBack: () => void }) {
  const [tab, setTab] = useState(0);
  const [showKey, setShowKey] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [q, setQ] = useState('');
  const [modal, setModal] = useState(false);
  const [optKey, setOptKey] = useState(true);
  const [busy, setBusy] = useState(false);
  const { width } = useWindowDimensions();
  const { handout: h, worksheet: w, transcript_clean: t } = lecture.result;
  const meta = [lecture.meta.grade, h.subject || lecture.meta.subject, lecture.meta.batchTag, lecture.meta.chapter].filter(Boolean).join(' • ');

  async function doExport() {
    setBusy(true);
    try { await exportPdf(lecture, { answerKey: optKey }); setModal(false); }
    catch (e: any) { Alert.alert('Export failed', e.message); }
    setBusy(false);
  }
  const lines = t.split('\n').filter((l) => l.trim() && l.toLowerCase().includes(q.toLowerCase()));

  return (
    <View style={g.screen}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 }}>
        <TouchableOpacity onPress={onBack}><Text style={{ color: C.cyan, fontSize: 16, fontWeight: '700' }}>‹ Back</Text></TouchableOpacity>
        <Text style={[g.text, { flex: 1, fontWeight: '800' }]} numberOfLines={1}>{h.title}</Text>
        <TouchableOpacity onPress={() => setModal(true)} style={{ backgroundColor: C.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, ...glow }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>PDF / Share</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', marginHorizontal: 12, backgroundColor: C.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: C.line }}>
        {TABS.map((n, i) => (
          <TouchableOpacity key={n} style={{ flex: 1, paddingVertical: 9, borderRadius: 10, backgroundColor: tab === i ? C.primary : 'transparent' }} onPress={() => setTab(i)}>
            <Text style={{ color: tab === i ? '#fff' : C.dim, textAlign: 'center', fontSize: 13, fontWeight: '700' }}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={g.pad} keyboardShouldPersistTaps="handled">
        {tab === 0 && (<>
          <Text style={g.dim}>{meta}</Text>
          <Text style={g.h2}>Summary</Text>
          {h.summary_bullets.map((b, i) => <Text key={i} style={[g.text, { marginBottom: 4 }]}>• {b}</Text>)}
          <Text style={g.h2}>Key Concepts</Text>
          {h.key_concepts.map((c, i) => <View key={i} style={g.card}><Text style={[g.text, { fontWeight: '800', color: C.cyan }]}>{c.heading}</Text><Text style={g.text}>{c.explanation}</Text></View>)}
          {h.diagram_svg ? (<>
            <Text style={g.h2}>Diagram</Text>
            <View style={{ backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', padding: 4 }}>
              <SvgXml xml={h.diagram_svg} width={width - 40} height={(width - 40) * 0.6} />
            </View>
            {h.diagram_caption ? <Text style={[g.dim, { marginTop: 6 }]}>{h.diagram_caption}</Text> : null}
          </>) : null}
          {h.formulas_and_rules.length > 0 && <Text style={g.h2}>Formulas & Rules</Text>}
          {h.formulas_and_rules.map((f, i) => (
            <View key={i} style={[g.card, { borderColor: C.ok }]}>
              <Text style={[g.text, { fontWeight: '800' }]}>{f.name}</Text>
              <Text style={[g.text, g.mono, { color: C.ok, marginVertical: 4 }]}>{f.expression}</Text>
              <Text style={[g.dim, g.mono, { color: C.cyan }]}>{f.variables_explained}</Text>
            </View>
          ))}
          {h.worked_examples.length > 0 && <Text style={g.h2}>Worked Examples</Text>}
          {h.worked_examples.map((e, i) => (
            <View key={i} style={g.card}>
              <Text style={[g.text, { fontWeight: '800' }]}>{i + 1}. {e.problem}</Text>
              {e.steps.map((s, j) => <Text key={j} style={g.text}>   {j + 1}) {s}</Text>)}
              <Text style={[g.text, { color: C.ok, fontWeight: '700', marginTop: 6 }]}>Answer: {e.final_answer}</Text>
            </View>
          ))}
          {h.exam_traps.length > 0 && <Text style={g.h2}>⚠ Exam Traps</Text>}
          {h.exam_traps.map((x, i) => <View key={i} style={[g.card, { borderColor: C.warn, borderLeftWidth: 4 }]}><Text style={g.text}>⚠ {x}</Text></View>)}
        </>)}
        {tab === 1 && (<>
          <View style={[g.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
            <Text style={[g.text, { fontWeight: '700' }]}>Show Answer Key & Solutions</Text>
            <Switch value={showKey} onValueChange={setShowKey} trackColor={{ true: C.primary }} />
          </View>
          <Text style={g.h2}>Taught in Classroom</Text>
          {w.classroom_questions.length === 0 && <Text style={g.dim}>No classroom questions were detected.</Text>}
          {w.classroom_questions.map((c) => {
            const show = showKey || open[c.label];
            return (
              <View key={c.label} style={g.card}>
                <Text style={[g.text, { color: C.cyan, fontWeight: '800' }]}>{c.label}</Text>
                <Text style={g.text}>{c.question}</Text>
                <TouchableOpacity onPress={() => setOpen({ ...open, [c.label]: !open[c.label] })}>
                  <Text style={{ color: C.primary, fontWeight: '700', marginTop: 8 }}>{show ? '▲ Hide solution' : '▼ Show solution'}</Text>
                </TouchableOpacity>
                {show && <><Text style={[g.dim, { marginTop: 6 }]}>{c.step_by_step_solution}</Text><Text style={[g.text, { color: C.ok, fontWeight: '700', marginTop: 4 }]}>Answer: {c.final_answer}</Text></>}
              </View>
            );
          })}
          <Text style={g.h2}>Extra Practice MCQs</Text>
          {w.mcqs.map((m) => {
            const ci = correctIndex(m); const sel = picked[m.q_no];
            return (
              <View key={m.q_no} style={g.card}>
                <Text style={[g.text, { fontWeight: '800' }]}>Q{m.q_no}. {m.question}</Text>
                {m.options.map((o, i) => {
                  const isRight = i === ci;
                  const chosen = sel === i;
                  const green = (sel !== undefined && isRight) || (showKey && isRight);
                  const red = chosen && !isRight;
                  return (
                    <TouchableOpacity key={i} disabled={sel !== undefined} onPress={() => setPicked({ ...picked, [m.q_no]: i })}
                      style={{ marginTop: 8, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: green ? C.ok : red ? C.bad : C.line, backgroundColor: green ? '#10B98122' : red ? '#F8717122' : C.surface }}>
                      <Text style={g.text}>({'ABCD'[i]}) {o}</Text>
                    </TouchableOpacity>
                  );
                })}
                {showKey && <Text style={[g.dim, { marginTop: 8 }]}>✓ {ci >= 0 ? `(${'ABCD'[ci]})` : m.correct_option}{'\n'}{m.explanation}</Text>}
              </View>
            );
          })}
          <Text style={g.h2}>Extra Short Answer / Numericals</Text>
          {w.short_answer.map((s) => (
            <View key={s.q_no} style={g.card}>
              <Text style={[g.text, { fontWeight: '800' }]}>Q{s.q_no}. {s.question}</Text>
              {showKey && <><Text style={[g.text, { color: C.ok, marginTop: 6 }]}>Answer: {s.answer}</Text><Text style={[g.dim, { marginTop: 4 }]}>{s.step_by_step_solution}</Text></>}
            </View>
          ))}
        </>)}
        {tab === 2 && (<>
          <TextInput style={g.input} placeholder="Search transcript…" placeholderTextColor={C.dim} value={q} onChangeText={setQ} />
          <View style={{ height: 10 }} />
          {lines.map((l, i) => {
            const stu = l.startsWith('Student:');
            return <Text key={i} style={[g.text, { marginBottom: 8, color: stu ? C.warn : C.text }]}>{l}</Text>;
          })}
          {lines.length === 0 && <Text style={g.dim}>No matching lines.</Text>}
        </>)}
      </ScrollView>
      <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#000a' }}>
          <View style={{ backgroundColor: C.surface, padding: 20, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, borderColor: C.line }}>
            <Text style={g.h1}>Export PDF</Text>
            <Text style={g.dim}>Handout, diagram, classroom questions and extra DPP.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <Text style={[g.text, { flex: 1, paddingRight: 10 }]}>Include Answer Key & Step-by-Step Solutions</Text>
              <Switch value={optKey} onValueChange={setOptKey} trackColor={{ true: C.primary }} />
            </View>
            <TouchableOpacity style={g.btn} onPress={doExport} disabled={busy}><Text style={g.btnText}>{busy ? 'Generating…' : 'Create PDF & Share'}</Text></TouchableOpacity>
            <TouchableOpacity style={[g.btn, g.btn2]} onPress={() => setModal(false)}><Text style={[g.btnText, { color: C.text }]}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
