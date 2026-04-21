// app/(tabs)/stats.tsx

import { Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, FontSize } from '@/constants/theme';

export default function StatsScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.text}>Estatísticas em breve</Text>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
    text: { color: Colors.textSecondary, fontSize: FontSize.lg },
});