import { neutral } from '@/constants/Colors';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ComerciosScreen() {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Comercios</Text>
                <Text style={styles.subtitle}>Encuentra los mejores lugares</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: neutral.white,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: neutral.white,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: neutral.gray800,
    },
    subtitle: {
        fontSize: 16,
        color: neutral.gray500,
        marginTop: 8,
    },
});
