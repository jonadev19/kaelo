import { brand, neutral } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function PerfilScreen() {
    const { signOut } = useAuth();
    const [isLocationEnabled, setIsLocationEnabled] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            'Cerrar Sesión',
            '¿Estás seguro de que deseas cerrar sesión?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel',
                },
                {
                    text: 'Cerrar Sesión',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo cerrar sesión. Intenta de nuevo.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={neutral.gray800} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil</Text>
                <TouchableOpacity style={styles.headerButton}>
                    <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Info */}
                <View style={styles.profileSection}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://i.pravatar.cc/300?img=11' }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.cameraButton}>
                            <Ionicons name="camera" size={16} color={neutral.white} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>Alejandro Pérez</Text>
                    <View style={styles.userBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={brand.primary} />
                        <Text style={styles.userBadgeText}>CICLISTA AVENTURERO</Text>
                    </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconContainer, { backgroundColor: '#FFEDD5' }]}>
                            <Ionicons name="map" size={20} color="#F97316" />
                        </View>
                        <Text style={styles.statValue}>12</Text>
                        <Text style={styles.statLabel}>Rutas</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconContainer, { backgroundColor: '#E0F2F1' }]}>
                            <Ionicons name="bicycle" size={20} color={brand.primary} />
                        </View>
                        <Text style={styles.statValue}>340</Text>
                        <Text style={styles.statLabel}>Kilómetros</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconContainer, { backgroundColor: '#FEF9C3' }]}>
                            <Ionicons name="trophy" size={20} color="#EAB308" />
                        </View>
                        <Text style={styles.statValue}>5</Text>
                        <Text style={styles.statLabel}>Medallas</Text>
                    </View>
                </View>

                {/* Menu Info */}
                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconBox}>
                            <Ionicons name="bag-handle" size={20} color={neutral.gray700} />
                        </View>
                        <Text style={styles.menuText}>Mis Pedidos</Text>
                        <Ionicons name="chevron-forward" size={20} color={neutral.gray400} />
                    </TouchableOpacity>

                    <View style={styles.separator} />

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconBox}>
                            <Ionicons name="heart" size={20} color={neutral.gray700} />
                        </View>
                        <Text style={styles.menuText}>Mis Rutas Guardadas</Text>
                        <Ionicons name="chevron-forward" size={20} color={neutral.gray400} />
                    </TouchableOpacity>

                    <View style={styles.separator} />

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconBox}>
                            <Ionicons name="card" size={20} color={neutral.gray700} />
                        </View>
                        <Text style={styles.menuText}>Métodos de Pago</Text>
                        <Ionicons name="chevron-forward" size={20} color={neutral.gray400} />
                    </TouchableOpacity>
                </View>

                {/* Security Section */}
                <Text style={styles.sectionHeader}>SEGURIDAD Y PRIVACIDAD</Text>

                <View style={styles.securityContainer}>
                    <View style={styles.securityRow}>
                        <View style={styles.securityIconBox}>
                            <Ionicons name="locate" size={22} color="#3B82F6" />
                        </View>
                        <View style={styles.securityInfo}>
                            <Text style={styles.securityTitle}>Ubicación en tiempo real</Text>
                            <Text style={styles.securitySubtitle}>Visible para amigos en ruta</Text>
                        </View>
                        <Switch
                            value={isLocationEnabled}
                            onValueChange={setIsLocationEnabled}
                            trackColor={{ false: neutral.gray200, true: brand.primary }}
                            thumbColor={neutral.white}
                        />
                    </View>

                    <TouchableOpacity style={styles.historyButton}>
                        <Ionicons name="time-outline" size={20} color={neutral.gray700} />
                        <Text style={styles.historyButtonText}>Gestionar Historial de Ubicación</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
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
        backgroundColor: '#F9FAFB', // Slight off-white mostly for background
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: neutral.white,
    },
    headerButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: neutral.gray800,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: brand.primary,
    },
    profileSection: {
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#E0F2F1', // Light turquoise ring
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: brand.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: neutral.white,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: neutral.gray900,
        marginBottom: 8,
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2F1',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 6,
    },
    userBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: brand.primary,
        letterSpacing: 0.5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: neutral.white,
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        marginHorizontal: 6,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: neutral.gray900,
    },
    statLabel: {
        fontSize: 12,
        color: neutral.gray500,
        marginTop: 2,
    },
    menuContainer: {
        backgroundColor: neutral.white,
        borderRadius: 24,
        padding: 8,
        marginBottom: 24,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    menuIconBox: {
        width: 36,
        height: 36,
        backgroundColor: neutral.gray100,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: neutral.gray800,
    },
    separator: {
        height: 1,
        backgroundColor: neutral.gray100,
        marginLeft: 64, // Align with text
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: neutral.gray500,
        marginBottom: 12,
        letterSpacing: 0.5,
        marginLeft: 4,
    },
    securityContainer: {
        backgroundColor: neutral.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    securityIconBox: {
        width: 40,
        height: 40,
        backgroundColor: '#EFF6FF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    securityInfo: {
        flex: 1,
    },
    securityTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: neutral.gray800,
    },
    securitySubtitle: {
        fontSize: 12,
        color: neutral.gray500,
        marginTop: 2,
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: neutral.gray200,
        gap: 8,
    },
    historyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: neutral.gray700,
    },
    logoutButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    logoutText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#EF4444', // Red 500
    },
});
