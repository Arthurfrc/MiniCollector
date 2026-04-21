// app/_layout.tsx

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '@/database/schema';

export default function RootLayout() {
    useEffect(() => {
        initDatabase().catch(console.error);
    }, []);

    return (
        <>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }} />
        </>
    );
}