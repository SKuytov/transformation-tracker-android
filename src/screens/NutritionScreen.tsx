import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, FlatList, RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Apple, Plus, Trash2, Search, ChevronDown, ChevronUp } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { store, uid } from '../data/store';
import { BUILTIN_FOODS } from '../data/seed';
import { todayStr, calcMacros } from '../lib/utils';
import { MacroBar } from '../components/MacroBar';
import { getCurrentPhase } from '../lib/utils';
import type { DayMeals, FoodItem, MealSlot, MealEntry, UserSettings } from '../data/types';

const MEAL_SLOTS: { slot: MealSlot; label: string; time: string }[] = [
  { slot: 'pre-workout', label: 'Pre-Workout', time: '04:30' },
  { slot: 'breakfast', label: 'Breakfast', time: '06:00' },
  { slot: 'lunch', label: 'Lunch', time: '12:30' },
  { slot: 'snack', label: 'Snack', time: '16:00' },
  { slot: 'dinner', label: 'Dinner', time: '19:30' },
];

export function NutritionScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [dayMeals, setDayMeals] = useState<DayMeals | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [expandedSlot, setExpandedSlot] = useState<MealSlot | null>('breakfast');
  const [showFoodPicker, setShowFoodPicker] = useState(false);
  const [activeSlot, setActiveSlot] = useState<MealSlot | null>(null);
  const [search, setSearch] = useState('');
  const [grams, setGrams] = useState('100');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [showCustomFood, setShowCustomFood] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customKcal, setCustomKcal] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [viewDate] = useState(todayStr());

  const allFoods = [...BUILTIN_FOODS, ...customFoods];

  const load = useCallback(async () => {
    const [dm, s, cf] = await Promise.all([
      store.getDayMeals(viewDate),
      store.getSettings(),
      store.getCustomFoods(),
    ]);
    setDayMeals(dm);
    setSettings(s);
    setCustomFoods(cf);
  }, [viewDate]);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openFoodPicker = (slot: MealSlot) => {
    setActiveSlot(slot);
    setSelectedFood(null);
    setGrams('100');
    setSearch('');
    setShowFoodPicker(true);
  };

  const addFood = async () => {
    if (!activeSlot || !selectedFood) return;
    const g = parseFloat(grams);
    if (isNaN(g) || g <= 0) { Alert.alert('Invalid', 'Enter valid grams'); return; }
    const macros = calcMacros(selectedFood.kcalPer100g, selectedFood.proteinPer100g, selectedFood.carbsPer100g, selectedFood.fatPer100g, g);
    const entry: MealEntry = {
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      grams: g,
      ...macros,
    };
    await store.addMealEntry(viewDate, activeSlot, entry);
    setShowFoodPicker(false);
    await load();
  };

  const removeEntry = async (slot: MealSlot, index: number) => {
    await store.removeMealEntry(viewDate, slot, index);
    await load();
  };

  const saveCustomFood = async () => {
    if (!customName || !customKcal || !customProtein || !customCarbs || !customFat) {
      Alert.alert('Error', 'Fill in all fields'); return;
    }
    const food: FoodItem = {
      id: 'custom-' + uid(),
      name: customName,
      kcalPer100g: parseFloat(customKcal),
      proteinPer100g: parseFloat(customProtein),
      carbsPer100g: parseFloat(customCarbs),
      fatPer100g: parseFloat(customFat),
      custom: true,
    };
    await store.addCustomFood(food);
    setShowCustomFood(false);
    setCustomName(''); setCustomKcal(''); setCustomProtein(''); setCustomCarbs(''); setCustomFat('');
    await load();
  };

  // Totals
  const allEntries = dayMeals ? Object.values(dayMeals.meals).flat() : [];
  const totalKcal = allEntries.reduce((s, e) => s + e.kcal, 0);
  const totalProtein = allEntries.reduce((s, e) => s + e.protein, 0);
  const totalCarbs = allEntries.reduce((s, e) => s + e.carbs, 0);
  const totalFat = allEntries.reduce((s, e) => s + e.fat, 0);

  const phase = settings ? getCurrentPhase(settings) : null;

  const filteredFoods = allFoods.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={[styles.title, { color: t.text }]}>Nutrition</Text>
        <Text style={[styles.date, { color: t.textMuted }]}>{viewDate}</Text>

        {/* Daily totals */}
        {phase && (
          <View style={[styles.totalsCard, { backgroundColor: t.card, borderColor: t.border }]}>
            <MacroBar label="Calories" current={totalKcal} target={phase.kcal} color={Colors.kcal} unit=" kcal" theme={theme} />
            <MacroBar label="Protein" current={totalProtein} target={phase.protein} color={Colors.protein} theme={theme} />
            <MacroBar label="Carbs" current={totalCarbs} target={phase.carbs} color={Colors.carbs} theme={theme} />
            <MacroBar label="Fat" current={totalFat} target={phase.fat} color={Colors.fat} theme={theme} />
          </View>
        )}

        {/* Meal slots */}
        {MEAL_SLOTS.map(({ slot, label, time }) => {
          const slotEntries = dayMeals?.meals[slot] ?? [];
          const slotKcal = slotEntries.reduce((s, e) => s + e.kcal, 0);
          const isExpanded = expandedSlot === slot;

          return (
            <View key={slot} style={[styles.mealCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <TouchableOpacity
                style={styles.mealHeader}
                onPress={() => setExpandedSlot(isExpanded ? null : slot)}
              >
                <View>
                  <Text style={[styles.mealLabel, { color: t.text }]}>{label}</Text>
                  <Text style={[styles.mealTime, { color: t.textMuted }]}>{time}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {slotKcal > 0 && (
                    <Text style={{ color: Colors.kcal, fontWeight: '700', fontSize: 14 }}>{slotKcal} kcal</Text>
                  )}
                  <TouchableOpacity
                    style={[styles.addSlotBtn, { backgroundColor: Colors.primary + '22' }]}
                    onPress={() => openFoodPicker(slot)}
                  >
                    <Plus size={16} color={Colors.primary} />
                  </TouchableOpacity>
                  {isExpanded ? <ChevronUp size={18} color={t.textMuted} /> : <ChevronDown size={18} color={t.textMuted} />}
                </View>
              </TouchableOpacity>

              {isExpanded && slotEntries.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {slotEntries.map((entry, i) => (
                    <View key={i} style={[styles.entryRow, { borderTopColor: t.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.entryName, { color: t.text }]}>{entry.foodName}</Text>
                        <Text style={[styles.entryMacros, { color: t.textMuted }]}>
                          {entry.grams}g · P:{entry.protein.toFixed(0)} C:{entry.carbs.toFixed(0)} F:{entry.fat.toFixed(0)} · {entry.kcal} kcal
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeEntry(slot, i)} style={{ padding: 6 }}>
                        <Trash2 size={15} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {isExpanded && slotEntries.length === 0 && (
                <Text style={{ color: t.textFaint, fontSize: 13, padding: 8 }}>No food logged yet.</Text>
              )}
            </View>
          );
        })}

        <TouchableOpacity
          style={[styles.customFoodBtn, { borderColor: t.border }]}
          onPress={() => setShowCustomFood(true)}
        >
          <Plus size={16} color={t.textMuted} />
          <Text style={{ color: t.textMuted, fontWeight: '600' }}>Add Custom Food to Library</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Food Picker Modal */}
      <Modal visible={showFoodPicker} transparent animationType="slide" onRequestClose={() => setShowFoodPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Add Food</Text>
            <View style={[styles.searchBar, { backgroundColor: t.surfaceAlt, borderColor: t.border }]}>
              <Search size={16} color={t.textFaint} />
              <TextInput
                style={{ flex: 1, color: t.text, fontSize: 15, marginLeft: 8 }}
                placeholder="Search foods..."
                placeholderTextColor={t.textFaint}
                value={search}
                onChangeText={setSearch}
              />
            </View>
            {selectedFood && (
              <View style={[styles.selectedFood, { backgroundColor: Colors.primary + '22', borderColor: Colors.primary + '44' }]}>
                <Text style={{ color: Colors.primary, fontWeight: '700' }}>{selectedFood.name}</Text>
                <Text style={{ color: t.textMuted, fontSize: 12 }}>
                  {selectedFood.kcalPer100g} kcal | P:{selectedFood.proteinPer100g} C:{selectedFood.carbsPer100g} F:{selectedFood.fatPer100g} (per 100g)
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <TextInput
                    style={[styles.gramsInput, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
                    placeholder="Grams"
                    placeholderTextColor={t.textFaint}
                    keyboardType="decimal-pad"
                    value={grams}
                    onChangeText={setGrams}
                  />
                  <Text style={{ color: t.textMuted }}>g</Text>
                  <TouchableOpacity style={[styles.addFoodBtn, { backgroundColor: Colors.primary }]} onPress={addFood}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <FlatList
              data={filteredFoods}
              keyExtractor={f => f.id}
              style={{ maxHeight: 300 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.foodRow, { borderBottomColor: t.border, backgroundColor: selectedFood?.id === item.id ? Colors.primary + '11' : 'transparent' }]}
                  onPress={() => setSelectedFood(item)}
                >
                  <Text style={{ color: t.text, fontWeight: '600', flex: 1 }}>{item.name}</Text>
                  <Text style={{ color: t.textMuted, fontSize: 12 }}>{item.kcalPer100g} kcal/100g</Text>
                  {item.custom && <Text style={{ color: Colors.accent, fontSize: 11, marginLeft: 4 }}>★</Text>}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={[styles.btn, { backgroundColor: t.border, marginTop: 10 }]} onPress={() => setShowFoodPicker(false)}>
              <Text style={{ color: t.text, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Food Modal */}
      <Modal visible={showCustomFood} transparent animationType="slide" onRequestClose={() => setShowCustomFood(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: t.surface, borderColor: t.border }]}>
            <Text style={[styles.modalTitle, { color: t.text }]}>Custom Food</Text>
            {[
              { placeholder: 'Name', value: customName, onChange: setCustomName, keyboard: 'default' },
              { placeholder: 'Kcal/100g', value: customKcal, onChange: setCustomKcal, keyboard: 'decimal-pad' },
              { placeholder: 'Protein/100g', value: customProtein, onChange: setCustomProtein, keyboard: 'decimal-pad' },
              { placeholder: 'Carbs/100g', value: customCarbs, onChange: setCustomCarbs, keyboard: 'decimal-pad' },
              { placeholder: 'Fat/100g', value: customFat, onChange: setCustomFat, keyboard: 'decimal-pad' },
            ].map(({ placeholder, value, onChange, keyboard }) => (
              <TextInput
                key={placeholder}
                style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surfaceAlt }]}
                placeholder={placeholder}
                placeholderTextColor={t.textFaint}
                value={value}
                onChangeText={onChange}
                keyboardType={keyboard as any}
              />
            ))}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: t.border, flex: 1 }]} onPress={() => setShowCustomFood(false)}>
                <Text style={{ color: t.text, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: Colors.primary, flex: 1 }]} onPress={saveCustomFood}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  date: { fontSize: 13, marginBottom: 14 },
  totalsCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 14 },
  mealCard: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 10 },
  mealHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealLabel: { fontSize: 15, fontWeight: '700' },
  mealTime: { fontSize: 12 },
  addSlotBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  entryRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 8, marginTop: 8 },
  entryName: { fontSize: 14, fontWeight: '600' },
  entryMacros: { fontSize: 12, marginTop: 2 },
  customFoodBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, borderStyle: 'dashed', padding: 14, justifyContent: 'center', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' },
  modal: { borderRadius: 20, borderWidth: 1, padding: 20, margin: 10, maxHeight: '90%' },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 10 },
  selectedFood: { borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 10 },
  gramsInput: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 15 },
  addFoodBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  foodRow: { paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 8 },
  btn: { padding: 14, borderRadius: 10, alignItems: 'center' },
});
