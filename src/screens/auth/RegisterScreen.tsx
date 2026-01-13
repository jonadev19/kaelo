import { brand, neutral } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ImageBackground,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

const { height } = Dimensions.get('window');

export function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { signUp } = useAuth();

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        const { error } = await signUp(email, password);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert(
                '¡Registro exitoso!',
                'Por favor verifica tu correo electrónico para activar tu cuenta.',
                [{ text: 'OK', onPress: () => router.replace('/login') }]
            );
        }
    };

    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.container}>
                <StatusBar style="light" />
                <ImageBackground
                    source={require('../../../assets/images/pyramid-background.png')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                >
                    {/* Top Section - Branding */}
                    <View style={styles.brandingContainer}>
                        <Text style={styles.logo}>Kaelo</Text>
                        <View style={styles.taglineContainer}>
                            <Text style={styles.tagline}>Explora Yucatán en dos ruedas</Text>
                        </View>
                    </View>
                </ImageBackground>

                {/* Bottom Sheet - Register Form */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.formContainer}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.handle} />

                        <Text style={styles.welcomeTitle}>Crear cuenta</Text>
                        <Text style={styles.welcomeSubtitle}>Únete a la aventura.</Text>

                        {/* Name Input */}
                        <Text style={styles.inputLabel}>Nombre completo</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={neutral.gray500} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Tu nombre"
                                placeholderTextColor={neutral.gray400}
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                                returnKeyType="next"
                            />
                        </View>

                        {/* Email Input */}
                        <Text style={styles.inputLabel}>Correo electrónico</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color={neutral.gray500} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="aventurero@ejemplo.com"
                                placeholderTextColor={neutral.gray400}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                            />
                        </View>

                        {/* Password Input */}
                        <Text style={styles.inputLabel}>Contraseña</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={neutral.gray500} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Mínimo 6 caracteres"
                                placeholderTextColor={neutral.gray400}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                returnKeyType="next"
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={neutral.gray500}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Confirm Password Input */}
                        <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="lock-closed-outline" size={20} color={neutral.gray500} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Repite tu contraseña"
                                placeholderTextColor={neutral.gray400}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry={!showConfirmPassword}
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={handleRegister}
                            />
                            <TouchableOpacity
                                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                style={styles.eyeIcon}
                            >
                                <Ionicons
                                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={neutral.gray500}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Register Button */}
                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color={neutral.white} />
                            ) : (
                                <>
                                    <Text style={styles.registerButtonText}>Crear cuenta</Text>
                                    <Ionicons name="arrow-forward" size={20} color={neutral.white} style={styles.buttonIcon} />
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Login Link */}
                        <View style={styles.loginContainer}>
                            <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                            <Link href="/login" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.loginLink}>Inicia sesión</Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: neutral.white,
    },
    backgroundImage: {
        height: height * 0.35,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandingContainer: {
        alignItems: 'center',
        marginTop: -20,
    },
    logo: {
        fontSize: 42,
        fontWeight: 'bold',
        color: neutral.white,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    taglineContainer: {
        backgroundColor: brand.primaryLight,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginTop: 8,
    },
    tagline: {
        color: neutral.white,
        fontSize: 13,
        fontWeight: '600',
    },
    formContainer: {
        flex: 1,
        backgroundColor: neutral.white,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: -30,
        paddingHorizontal: 24,
        paddingTop: 12,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: neutral.gray200,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 16,
    },
    welcomeTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: neutral.gray800,
        textAlign: 'center',
        marginBottom: 6,
    },
    welcomeSubtitle: {
        fontSize: 15,
        color: neutral.gray500,
        textAlign: 'center',
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: neutral.gray800,
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.gray100,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 14,
        height: 50,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: neutral.gray800,
    },
    eyeIcon: {
        padding: 4,
    },
    registerButton: {
        backgroundColor: brand.primary,
        borderRadius: 30,
        height: 54,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 20,
        shadowColor: brand.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonText: {
        color: neutral.white,
        fontSize: 17,
        fontWeight: '600',
        marginRight: 8,
    },
    buttonIcon: {
        marginLeft: 4,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 30,
    },
    loginText: {
        color: neutral.gray500,
        fontSize: 14,
    },
    loginLink: {
        color: brand.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});

