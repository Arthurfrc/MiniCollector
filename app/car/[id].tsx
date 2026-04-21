// app/car/[id].tsx

import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCarById, deleteCar } from '@/database/carRepository';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { Car } from '@/types/Car';

export default function CarDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const [car, setCar] = useState<Car | null>(null);

    useEffect(() => {
        if (id) getCarById(id).then(setCar);
    }, [id]);

    const handleDelete = () => {
        Alert.alert('Excluir', `Remover "${car?.name}" da coleção?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Excluir', style: 'destructive',
                onPress: async () => {
                    await deleteCar(id!);
                    router.back();
                },
            },
        ]);
    };

    if (!car) return (
        <View style={styles.centered}>
            <Text style={{ color: Colors.textMuted }}>Carregando...</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title} numberOfLines={1}>{car.name}</Text>
                <TouchableOpacity onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={22} color={Colors.error} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Row label="Fabricante" value={car.manufacture} />
                <Row label="Marca" value={car.brand} />
                <Row label="Ano" value={car.year ? String(car.year) : undefined} />
                <Row label="Escala" value={car.scale} />
                <Row label="Condição" value={car.condition} />
                <Row label="Cor" value={car.color} />
                <Row label="Cor (Wiki)" value={car.baseColor} />
                <Row label="Série" value={car.serie} />
                <Row label="Nome Série" value={car.cardSeriesName} />
                <Row label="Nº Série" value={car.cardSeriesNumber} />
                <Row label="Nº Coleção" value={car.cardCollectionNumber} />
                <Row label="Base Code" value={car.baseCode} />
                <Row label="País" value={car.country} />
                <Row label="Obs." value={car.notes} />
            </ScrollView>
        </SafeAreaView>
    );
}

function Row({ label, value }: { label: string; value?: string }) {
    if (!value) return null;
    return (
        <View style={styles.row}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    title: { flex: 1, fontSize: FontSize.lg, fontWeight: '700', color: Colors.text, marginHorizontal: Spacing.md },
    content: { padding: Spacing.md, gap: Spacing.sm },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
    rowLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
    rowValue: { fontSize: FontSize.sm, color: Colors.text, flex: 2, textAlign: 'right' },
});