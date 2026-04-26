import React, { useContext, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, Alert, Modal, Dimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Camera, ImagePlus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ThemeContext } from '../theme/ThemeContext';
import { Colors } from '../theme/colors';
import { store, uid } from '../data/store';
import { savePhotoToDocuments, deletePhotoFile } from '../data/photos';
import { todayStr } from '../lib/utils';
import { format } from 'date-fns';
import type { ProgressPhoto, PhotoTag } from '../data/types';

const W = Dimensions.get('window').width;
const PHOTO_TAGS: PhotoTag[] = ['front', 'side', 'back'];

export function PhotosScreen() {
  const { theme } = useContext(ThemeContext);
  const t = theme === 'dark' ? Colors.dark : Colors.light;
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [selectedTag, setSelectedTag] = useState<PhotoTag>('front');
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<ProgressPhoto | null>(null);
  const [compareB, setCompareB] = useState<ProgressPhoto | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<ProgressPhoto | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const p = await store.getPhotos();
    setPhotos(p);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await savePhoto(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      await savePhoto(result.assets[0].uri);
    }
  };

  const savePhoto = async (tempUri: string) => {
    try {
      const { uri, sizeKb, id } = await savePhotoToDocuments(tempUri, selectedTag);
      const photo: ProgressPhoto = {
        id,
        date: todayStr(),
        tag: selectedTag,
        dataUrl: uri, // file:// URI on Android
        sizeKb,
      };
      await store.addPhoto(photo);
      await load();
    } catch (e) {
      Alert.alert('Error', 'Failed to save photo: ' + String(e));
    }
  };

  const deletePhoto = (photo: ProgressPhoto) => {
    Alert.alert('Delete Photo', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deletePhotoFile(photo.dataUrl);
          await store.deletePhoto(photo.id);
          await load();
        }
      },
    ]);
  };

  const filteredPhotos = selectedTag ? photos.filter(p => p.tag === selectedTag) : photos;

  // Group by date for display
  const byDate: Record<string, ProgressPhoto[]> = {};
  for (const p of filteredPhotos) {
    if (!byDate[p.date]) byDate[p.date] = [];
    byDate[p.date].push(p);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <Text style={[styles.title, { color: t.text }]}>Progress Photos</Text>

        {/* Tag selector */}
        <View style={styles.tagRow}>
          {PHOTO_TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagBtn, {
                backgroundColor: selectedTag === tag ? Colors.primary : t.surfaceAlt,
                borderColor: selectedTag === tag ? Colors.primary : t.border,
              }]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text style={{ color: selectedTag === tag ? '#fff' : t.textMuted, fontWeight: '700', textTransform: 'capitalize' }}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.primary, flex: 1 }]}
            onPress={takePhoto}
          >
            <Camera size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: t.card, borderWidth: 1, borderColor: t.border, flex: 1 }]}
            onPress={pickFromGallery}
          >
            <ImagePlus size={18} color={Colors.primary} />
            <Text style={{ color: Colors.primary, fontWeight: '700', fontSize: 14 }}>From Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Compare mode toggle */}
        <TouchableOpacity
          style={[styles.compareToggle, { backgroundColor: compareMode ? Colors.accent + '22' : t.surfaceAlt, borderColor: compareMode ? Colors.accent : t.border }]}
          onPress={() => { setCompareMode(!compareMode); setCompareA(null); setCompareB(null); }}
        >
          <Text style={{ color: compareMode ? Colors.accent : t.textMuted, fontWeight: '700' }}>
            {compareMode ? 'Exit Compare Mode' : 'Side-by-Side Compare'}
          </Text>
        </TouchableOpacity>

        {/* Compare view */}
        {compareMode && (compareA || compareB) && (
          <View style={[styles.compareView, { borderColor: t.border }]}>
            <Text style={[styles.compareLabel, { color: t.textMuted }]}>Select two photos to compare</Text>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[compareA, compareB].map((p, i) => (
                <View key={i} style={{ flex: 1, aspectRatio: 0.75, borderRadius: 8, overflow: 'hidden', backgroundColor: t.border }}>
                  {p ? (
                    <Image source={{ uri: p.dataUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: t.textFaint, fontSize: 12 }}>Tap photo {i + 1}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Photo grid by date */}
        {Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a)).map(([date, datePhotos]) => (
          <View key={date} style={{ marginBottom: 16 }}>
            <Text style={[styles.dateLabel, { color: t.textMuted }]}>{format(new Date(date), 'EEE, MMM d yyyy')}</Text>
            <View style={styles.photoGrid}>
              {datePhotos.map(photo => (
                <TouchableOpacity
                  key={photo.id}
                  style={[
                    styles.photoTile,
                    compareMode && (compareA?.id === photo.id || compareB?.id === photo.id)
                      ? { borderColor: Colors.accent, borderWidth: 3 }
                      : {}
                  ]}
                  onPress={() => {
                    if (compareMode) {
                      if (!compareA) setCompareA(photo);
                      else if (!compareB) setCompareB(photo);
                      else { setCompareA(photo); setCompareB(null); }
                    } else {
                      setLightboxPhoto(photo);
                    }
                  }}
                  onLongPress={() => deletePhoto(photo)}
                >
                  <Image source={{ uri: photo.dataUrl }} style={styles.photoImg} resizeMode="cover" />
                  <View style={styles.photoTagBadge}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700', textTransform: 'capitalize' }}>{photo.tag}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {filteredPhotos.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Camera size={48} color={t.textFaint} />
            <Text style={{ color: t.textMuted, marginTop: 12, fontSize: 16 }}>No {selectedTag} photos yet</Text>
            <Text style={{ color: t.textFaint, fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              Take a photo or pick from your gallery to start tracking progress.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Lightbox */}
      <Modal visible={!!lightboxPhoto} transparent animationType="fade" onRequestClose={() => setLightboxPhoto(null)}>
        <View style={{ flex: 1, backgroundColor: '#000e', justifyContent: 'center', alignItems: 'center' }}>
          {lightboxPhoto && (
            <>
              <Image
                source={{ uri: lightboxPhoto.dataUrl }}
                style={{ width: W, height: W * 1.33 }}
                resizeMode="contain"
              />
              <Text style={{ color: '#fff', marginTop: 12, fontSize: 15 }}>
                {format(new Date(lightboxPhoto.date), 'EEE, MMM d yyyy')} · {lightboxPhoto.tag}
              </Text>
              <Text style={{ color: '#aaa', fontSize: 12 }}>{lightboxPhoto.sizeKb} KB</Text>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 20 }}>
                <TouchableOpacity onPress={() => { deletePhoto(lightboxPhoto!); setLightboxPhoto(null); }} style={{ padding: 12 }}>
                  <Trash2 size={24} color={Colors.error} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setLightboxPhoto(null)} style={{ padding: 12, backgroundColor: '#fff2', borderRadius: 30, paddingHorizontal: 24 }}>
                  <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const TILE_SIZE = (W - 48) / 3;

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: '800', marginBottom: 14 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tagBtn: { flex: 1, padding: 10, borderRadius: 20, borderWidth: 1, alignItems: 'center' },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 12, borderRadius: 10 },
  compareToggle: { padding: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', marginBottom: 14 },
  compareView: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 14 },
  compareLabel: { fontSize: 12, textAlign: 'center', marginBottom: 8 },
  dateLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  photoTile: { width: TILE_SIZE, height: TILE_SIZE * 1.33, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  photoImg: { width: '100%', height: '100%' },
  photoTagBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: '#0008', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
});
