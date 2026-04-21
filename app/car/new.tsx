// app/car/new.tsx

import { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, StyleSheet, Alert, Modal, FlatList, ActivityIndicator, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCars } from '@/hooks/useCars';
import {
    searchWiki, getCarVersions,
    WikiSearchResult, CarVersion,
    getCarFromWikiUrl,
    extractPageTitleFromUrl,
} from '@/services/wikiService';
import { Colors, Spacing, FontSize, Radius } from '@/constants/theme';
import { Condition } from '@/types/Car';
import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';

const CONDITIONS: { value: Condition; label: string }[] = [
    { value: 'mint', label: '💎 Mint' },
    { value: 'excellent', label: '⭐ Excelente' },
    { value: 'good', label: '👍 Bom' },
    { value: 'fair', label: '🔧 Regular' },
    { value: 'poor', label: '⚠️ Ruim' },
];

export default function NewCarScreen() {
    const { addCar } = useCars();

    // Campos do formulário
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [manufacture, setManuf] = useState('Hot Wheels');
    const [year, setYear] = useState('');
    const [scale, setScale] = useState('1:64');
    const [condition, setCondition] = useState<Condition>('good');
    const [color, setColor] = useState('');
    const [serie, setSerie] = useState('');
    const [baseCode, setBaseCode] = useState('');
    const [notes, setNotes] = useState('');

    // Wiki
    const [wikiQuery, setWikiQuery] = useState('');
    const [wikiModal, setWikiModal] = useState(false);
    const [wikiStep, setWikiStep] = useState<'search' | 'versions'>('search');
    const [wikiResults, setWikiResults] = useState<WikiSearchResult[]>([]);
    const [versions, setVersions] = useState<CarVersion[]>([]);
    const [selectedPage, setSelectedPage] = useState('');
    const [wikiLoading, setWikiLoading] = useState(false);

    const [imageUri, setImageUri] = useState<string | undefined>();

    const handleWikiSearch = async () => {
        if (!wikiQuery.trim()) return;
        setWikiLoading(true);

        // Verifica se é URL
        if (wikiQuery.includes('hotwheels.fandom.com/wiki/')) {
            const pageTitle = extractPageTitleFromUrl(wikiQuery);
            if (pageTitle) {
                setSelectedPage(pageTitle);
                setWikiStep('versions');
                setWikiModal(true);
                const vers = await getCarVersions(pageTitle);
                setVersions(vers);
                setWikiLoading(false);
                return;
            }
        }

        // Busca normal
        setWikiStep('search');
        setWikiModal(true);
        const results = await searchWiki(wikiQuery);
        setWikiResults(results);
        setWikiLoading(false);
    };

    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permissão necessária', 'Precisamos acessar sua galeria.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            const src = result.assets[0].uri;
            const destPath = Paths.document + `cars/${Date.now()}.jpg`;

            // Cria o diretório se não existir
            const dir = new Directory(Paths.document + 'cars/');
            if (!dir.exists) await dir.create();

            // Copia o arquivo
            const srcFile = new File(src);
            await srcFile.copy(new File(destPath));

            setImageUri(destPath);
        }
    };

    const handleSelectPage = async (result: WikiSearchResult) => {
        setWikiLoading(true);
        setSelectedPage(result.title);
        setWikiStep('versions');
        const vers = await getCarVersions(result.title);
        setVersions(vers);
        setWikiLoading(false);
    };

    const handleSelectVersion = (version: CarVersion) => {
        console.log('=== VERSÃO SELECIONADA ===');
        console.log(JSON.stringify(version, null, 2));
        console.log('=========================');
        setName(selectedPage.replace(/_/g, ' '));
        if (version.year) setYear(version.year);
        if (version.baseColor ?? version.color) setColor(version.baseColor ?? version.color ?? '');
        if (version.cardSeriesName ?? version.series) setSerie(version.cardSeriesName ?? version.series ?? '');
        if (version.toyNumber) setBaseCode(version.toyNumber);
        setWikiModal(false);
        setWikiStep('search');
    };

    const handleCloseModal = () => { setWikiModal(false); setWikiStep('search'); };
    const handleBackToSearch = () => { setWikiStep('search'); setVersions([]); };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Atenção', 'O nome do carro é obrigatório.');
            return;
        }

        await addCar({
            name: name.trim(),
            brand: brand.trim(),
            manufacture: manufacture.trim(),
            year: parseInt(year) || 0,
            scale: scale.trim(),
            condition,
            color: color.trim() || undefined,
            serie: serie.trim() || undefined,
            baseCode: baseCode.trim() || undefined,
            notes: notes.trim() || undefined,
            imageUri: imageUri,
            thumbnailUri: imageUri,
            lastUpdate: new Date().toISOString(),
        });

        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Novo Carro</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Salvar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
                {/* Busca Wiki */}
                <View style={styles.wikiSection}>
                    <Text style={styles.label}>🔍 Buscar na Wiki Hot Wheels</Text>
                    <View style={styles.wikiRow}>
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="Ex: Ferrari 488..."
                            placeholderTextColor={Colors.textMuted}
                            value={wikiQuery}
                            onChangeText={setWikiQuery}
                            onSubmitEditing={() => { handleWikiSearch(); }}
                        />
                        <TouchableOpacity
                            style={styles.wikiBtn}
                            onPress={() => { handleWikiSearch(); }}
                        >
                            <Ionicons name="search" size={20} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Foto */}
                <TouchableOpacity style={styles.photoBox} onPress={handlePickImage}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="camera-outline" size={32} color={Colors.textMuted} />
                            <Text style={styles.photoPlaceholderText}>Adicionar foto</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Campos */}
                <Field label="Nome *" value={name} onChangeText={setName} placeholder="Ex: Ferrari 488 GT3" />
                <Field label="Marca do Carro" value={brand} onChangeText={setBrand} placeholder="Ex: Ferrari" />
                <Field label="Fabricante" value={manufacture} onChangeText={setManuf} placeholder="Hot Wheels" />
                <Field label="Ano" value={year} onChangeText={setYear} placeholder="Ex: 2021" keyboardType="numeric" />
                <Field label="Escala" value={scale} onChangeText={setScale} placeholder="Ex: 1:64" />
                <Field label="Série" value={serie} onChangeText={setSerie} placeholder="Ex: HW Screen Time" />
                <Field label="Código (Base Code)" value={baseCode} onChangeText={setBaseCode} placeholder="Ex: CFH20" />
                <Field label="Cor" value={color} onChangeText={setColor} placeholder="Ex: Vermelho" />

                {/* Condição */}
                <Text style={styles.label}>Estado de Conservação</Text>
                <View style={styles.conditionRow}>
                    {CONDITIONS.map(c => (
                        <TouchableOpacity
                            key={c.value}
                            style={[styles.condBtn, condition === c.value && styles.condBtnActive]}
                            onPress={() => setCondition(c.value)}
                        >
                            <Text style={[styles.condText, condition === c.value && styles.condTextActive]}>
                                {c.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Field label="Observações" value={notes} onChangeText={setNotes} placeholder="Anotações extras..." multiline />
            </ScrollView>

            {/* Modal Wiki */}
            <Modal visible={wikiModal} animationType="slide" onRequestClose={handleCloseModal}>
                <SafeAreaView style={styles.modal}>

                    <View style={styles.modalHeader}>
                        {wikiStep === 'versions' ? (
                            <TouchableOpacity onPress={handleBackToSearch}>
                                <Ionicons name="arrow-back" size={24} color={Colors.text} />
                            </TouchableOpacity>
                        ) : (
                            <View style={{ width: 24 }} />
                        )}
                        <Text style={styles.title}>
                            {wikiStep === 'search' ? 'Resultados' : selectedPage.replace(/_/g, ' ')}
                        </Text>
                        <TouchableOpacity onPress={handleCloseModal}>
                            <Ionicons name="close" size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>

                    {wikiLoading ? (
                        <View style={styles.centered}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.loadingText}>
                                {wikiStep === 'versions' ? 'Carregando versões...' : 'Buscando...'}
                            </Text>
                        </View>
                    ) : wikiStep === 'search' ? (
                        <FlatList
                            data={wikiResults}
                            keyExtractor={item => String(item.pageId)}
                            contentContainerStyle={{ padding: Spacing.md }}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.wikiItem} onPress={() => handleSelectPage(item)}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.wikiItemTitle}>{item.title}</Text>
                                        <Text style={styles.wikiItemSnippet} numberOfLines={2}>{item.snippet}</Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>Nenhum resultado encontrado.</Text>
                            }
                        />
                    ) : (
                        <FlatList
                            data={versions}
                            keyExtractor={(_, i) => String(i)}
                            contentContainerStyle={{ padding: Spacing.md }}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.versionItem}
                                    onPress={() => handleSelectVersion(item)}
                                    activeOpacity={0.75}
                                >
                                    <View style={styles.versionPhoto}>
                                        {item.photoUrl ? (
                                            <Image
                                                source={{ uri: item.photoUrl }}
                                                style={styles.versionImage}
                                                resizeMode="contain"
                                            />
                                        ) : (
                                            <Ionicons name="car-sport-outline" size={32} color={Colors.textMuted} />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.versionLabel}>{item.label}</Text>
                                        <View style={styles.versionTags}>
                                            {item.year && <Tag text={item.year} />}
                                            {item.color && <Tag text={item.color} color={Colors.primary} />}
                                            {item.toyNumber && <Tag text={item.toyNumber} />}
                                            {item.country && <Tag text={item.country} />}
                                        </View>
                                    </View>
                                    <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={
                                <Text style={styles.emptyText}>Nenhuma versão encontrada nesta página.</Text>
                            }
                        />
                    )}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

// Componente auxiliar de campo
function Field({ label, ...props }: { label: string } & any) {
    return (
        <>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={[styles.input, props.multiline && { height: 80, textAlignVertical: 'top' }]}
                placeholderTextColor={Colors.textMuted}
                {...props}
            />
        </>
    );
}

function Tag({ text, color = Colors.textMuted }: { text: string; color?: string }) {
    return (
        <View style={[styles.tag, { borderColor: color + '55' }]}>
            <Text style={[styles.tagText, { color }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text },
    saveBtn: { backgroundColor: Colors.primary, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.md },
    saveBtnText: { color: '#fff', fontWeight: '600', fontSize: FontSize.md },
    form: { padding: Spacing.md, paddingBottom: 60 },
    label: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.md, fontWeight: '500' },
    input: { backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, color: Colors.text, fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border },
    wikiSection: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '44' },
    wikiRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
    wikiBtn: { backgroundColor: Colors.primary, width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
    conditionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
    condBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.full, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    condBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    condText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    condTextActive: { color: '#fff', fontWeight: '600' },
    modal: { flex: 1, backgroundColor: Colors.background },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
    wikiItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
    wikiItemTitle: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
    wikiItemSnippet: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 4 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
    loadingText: { color: Colors.textSecondary, fontSize: FontSize.md },
    emptyText: { color: Colors.textMuted, textAlign: 'center', marginTop: 40 },
    versionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, gap: Spacing.md },
    versionPhoto: { width: 72, height: 52, backgroundColor: Colors.surfaceLight, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    versionImage: { width: 72, height: 52 },
    versionLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text, marginBottom: 6 },
    versionTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.sm, borderWidth: 1 },
    tagText: { fontSize: FontSize.xs, fontWeight: '500' },
    photoBox: { height: 180, backgroundColor: Colors.surface, borderRadius: Radius.lg, marginBottom: Spacing.md, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
    photoPreview: { width: '100%', height: '100%' },
    photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
    photoPlaceholderText: { color: Colors.textMuted, fontSize: FontSize.sm },
});