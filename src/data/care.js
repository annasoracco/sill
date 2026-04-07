import { db } from '../firebase.js';
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

function careCollection(userId, plantId) {
  return collection(db, 'users', userId, 'plants', plantId, 'careSchedule');
}

export const CARE_TYPES = {
  fertilize: {
    label: 'Fertilize',
    icon: 'fa-flask',
    color: 'var(--brass)',
    defaultFrequency: 30,
    description: 'Feed your plant nutrients for healthy growth',
  },
  repot: {
    label: 'Repot',
    icon: 'fa-arrows-up-down',
    color: 'var(--terracotta)',
    defaultFrequency: 365,
    description: 'Move to a bigger pot when roots outgrow the current one',
  },
  rotate: {
    label: 'Rotate',
    icon: 'fa-rotate',
    color: 'var(--sage)',
    defaultFrequency: 14,
    description: 'Turn the pot so all sides get even light',
  },
  prune: {
    label: 'Prune',
    icon: 'fa-scissors',
    color: 'var(--moss)',
    defaultFrequency: 90,
    description: 'Trim dead or overgrown leaves and stems',
  },
  clean: {
    label: 'Clean leaves',
    icon: 'fa-hand-sparkles',
    color: 'var(--sage-mist)',
    defaultFrequency: 30,
    description: 'Wipe dust off leaves so they can breathe',
  },
};

export async function getCareSchedules(userId, plantId) {
  const q = query(careCollection(userId, plantId), orderBy('nextDue', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addCareSchedule(userId, plantId, schedule) {
  const data = {
    ...schedule,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(careCollection(userId, plantId), data);
  return docRef.id;
}

export async function updateCareSchedule(userId, plantId, scheduleId, updates) {
  const ref = doc(db, 'users', userId, 'plants', plantId, 'careSchedule', scheduleId);
  await updateDoc(ref, updates);
}

export async function deleteCareSchedule(userId, plantId, scheduleId) {
  await deleteDoc(doc(db, 'users', userId, 'plants', plantId, 'careSchedule', scheduleId));
}

export async function markCareDone(userId, plantId, scheduleId, frequencyDays) {
  const now = new Date();
  const nextDue = new Date(now);
  nextDue.setDate(nextDue.getDate() + frequencyDays);

  await updateCareSchedule(userId, plantId, scheduleId, {
    lastDone: now,
    nextDue: nextDue,
  });
}

// Species-specific frequency overrides (days).
// Keys are matched case-insensitively against plant species.
const SPECIES_CARE_OVERRIDES = {
  pothos:        { prune: 42, fertilize: 21 },
  epipremnum:    { prune: 42, fertilize: 21 },
  tradescantia:  { prune: 28 },
  monstera:      { prune: 56 },
  philodendron:  { prune: 56 },
  basil:         { prune: 14, fertilize: 14 },
  mint:          { prune: 14, fertilize: 14 },
  fern:          { prune: 30, clean: 14 },
  nephrolepis:   { prune: 30, clean: 14 },
  adiantum:      { prune: 30, clean: 14 },
  calathea:      { clean: 14, rotate: 7 },
  maranta:       { clean: 14, rotate: 7 },
  sansevieria:   { prune: 180, fertilize: 60, rotate: 30 },
  'snake plant': { prune: 180, fertilize: 60, rotate: 30 },
  dracaena:      { prune: 120, fertilize: 60 },
  'zz plant':    { prune: 180, fertilize: 60 },
  zamioculcas:   { prune: 180, fertilize: 60 },
  cactus:        { prune: 365, fertilize: 60, clean: 60, rotate: 30 },
  cacti:         { prune: 365, fertilize: 60, clean: 60, rotate: 30 },
  succulent:     { prune: 180, fertilize: 60, clean: 60 },
  echeveria:     { prune: 180, fertilize: 60, clean: 60 },
  aloe:          { prune: 120, fertilize: 60 },
  'fiddle leaf':  { prune: 90, clean: 14, rotate: 7 },
  ficus:         { prune: 90, clean: 14 },
  rubber:        { prune: 90, clean: 14 },
  orchid:        { prune: 180, fertilize: 14, repot: 730 },
  lavender:      { prune: 42, fertilize: 30 },
  rosemary:      { prune: 42, fertilize: 30 },
  'spider plant': { prune: 60, fertilize: 21 },
  chlorophytum:  { prune: 60, fertilize: 21 },
  peace:         { prune: 60, clean: 14 },
  spathiphyllum: { prune: 60, clean: 14 },
};

function getOverridesForSpecies(species) {
  if (!species) return {};
  const lower = species.toLowerCase().trim();
  for (const [key, overrides] of Object.entries(SPECIES_CARE_OVERRIDES)) {
    if (lower.includes(key)) return overrides;
  }
  return {};
}

export async function initializeDefaultCareSchedules(userId, plantId, species) {
  const overrides = getOverridesForSpecies(species);
  const now = new Date();

  const promises = Object.entries(CARE_TYPES).map(([type, meta]) => {
    const freq = overrides[type] ?? meta.defaultFrequency;
    const nextDue = new Date(now);
    nextDue.setDate(nextDue.getDate() + freq);

    return addCareSchedule(userId, plantId, {
      type,
      frequencyDays: freq,
      lastDone: null,
      nextDue,
    });
  });

  await Promise.all(promises);
}

// Helpers
export function getCareStatus(schedule) {
  if (!schedule.nextDue) return 'unknown';
  const due = schedule.nextDue.toDate ? schedule.nextDue.toDate() : new Date(schedule.nextDue);
  const now = new Date();
  const daysUntil = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  if (daysUntil < 0) return 'overdue';
  if (daysUntil === 0) return 'due';
  if (daysUntil <= 3) return 'soon';
  return 'ok';
}

export function daysUntilDue(schedule) {
  if (!schedule.nextDue) return null;
  const due = schedule.nextDue.toDate ? schedule.nextDue.toDate() : new Date(schedule.nextDue);
  return Math.ceil((due - new Date()) / (1000 * 60 * 60 * 24));
}

export function formatDueDate(schedule) {
  const days = daysUntilDue(schedule);
  if (days === null) return 'Not scheduled';
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return `In ${Math.ceil(days / 7)} weeks`;
}
