import { StyleSheet } from 'react-native';

export const C = {
  orange: '#FF5733',
  orangeSoft: '#FFF3EF',
  blue: '#2D7FD3',
  tab: '#1C7FA6',
  text: '#222',
  muted: '#666',
  card: 'rgba(246,246,246,0.93)',
  chip: 'rgba(240,240,240,0.92)',
  green: '#2DBE4E',
  amber: '#F2A31B',
  red: '#E53935',
  white: '#fff',
  shade: 'rgba(0,0,0,0.38)',
};

export const S = StyleSheet.create({
  section: {
    color: C.white,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.75)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  cardAccent: { borderLeftWidth: 5, borderLeftColor: C.blue },
  cardTitle: { color: C.blue, fontSize: 19, fontWeight: '700', marginBottom: 8 },
  line: { color: C.text, fontSize: 16, lineHeight: 24 },
  strong: { color: C.orange, fontSize: 16, fontWeight: '700', marginTop: 8, lineHeight: 22 },
  note: { color: C.muted, fontSize: 14, fontStyle: 'italic', marginTop: 10, lineHeight: 20 },
  button: {
    backgroundColor: C.orange,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: C.white, fontSize: 19, fontWeight: '700' },
  input: {
    backgroundColor: 'rgba(245,245,245,0.95)',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 18,
    color: C.text,
  },
  label: { color: C.text, fontSize: 15, fontWeight: '600', marginTop: 14, marginBottom: 6 },
});
