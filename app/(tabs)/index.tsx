// app/(tabs)/index.tsx

import { useState, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCars } from '@/hooks/useCars';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { Car } from '@/types/Car';

export default function CollectionScreen() {
    const { cars, loading, search, reload } = useCars();
    const [query, setQuery] = useState('');

    const handleSearch = (text: string) => {
        setQuery(text);
        search(text);
    };

    useFocusEffect(
        useCallback(() => {
            reload();
        }, [reload])
    );

    const renderItem = ({ item }: { item: Car }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/car/${item.id}`)}
            activeOpacity={0.7}
        >
            <View style={styles.cardIcon}>
                <Ionicons name="car-sport" size={28} color={Colors.primary} />
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.cardSub}>
                    {item.manufacture} • {item.year || '—'} • {item.scale}
                </Text>
                {item.serie ? (
                    <Text style={styles.cardSerie} numberOfLines={1}>{item.serie}</Text>
                ) : null}
            </View>
            <View style={[styles.conditionDot, { backgroundColor: Colors.condition[item.condition] }]} />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>MiniCollector</Text>
                    <Text style={styles.subtitle}>{cars.length} carros na coleção</Text>
                </View>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/car/new')}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar por nome, marca, série..."
                    placeholderTextColor={Colors.textMuted}
                    value={query}
                    onChangeText={handleSearch}
                    returnKeyType="search"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* List */}
            {loading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            ) : cars.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="car-sport-outline" size={64} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>Sua coleção está vazia</Text>
                    <Text style={styles.emptySubtext}>Toque no + para adicionar seu primeiro carro</Text>
                </View>
            ) : (
                <FlatList
                    data={cars}
                    keyExtractor={item => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, paddingBottom: Spacing.sm },
    title: { fontSize: FontSize.xl, fontWeight: '700', color: Colors.text },
    subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    addButton: { backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, marginHorizontal: Spacing.md, marginBottom: Spacing.md, borderRadius: Radius.md, paddingHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.border },
    searchIcon: { marginRight: Spacing.sm },
    searchInput: { flex: 1, height: 44, color: Colors.text, fontSize: FontSize.md },
    list: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
    cardIcon: { width: 48, height: 48, backgroundColor: Colors.surfaceLight, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
    cardInfo: { flex: 1 },
    cardName: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    cardSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
    cardSerie: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 3 },
    conditionDot: { width: 10, height: 10, borderRadius: Radius.full, marginLeft: Spacing.sm },
    loader: { flex: 1, justifyContent: 'center' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
    emptyText: { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary, marginTop: Spacing.md },
    emptySubtext: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' },
});