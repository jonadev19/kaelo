import { accessibleText, brand, neutral, radius, shadows, touchTarget } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    const [focusedField, setFocusedField] = useState<string | null>(null);
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

    const renderInput = (
        field: string,
        icon: string,
        placeholder: string,
        value: string,
        onChangeText: (text: string) => void,
        options: {
            secureTextEntry?: boolean;
            showPassword?: boolean;
            onTogglePassword?: () => void;
            keyboardType?: 'default' | 'email-address';
            autoCapitalize?: 'none' | 'words';
            returnKeyType?: 'next' | 'done';
            onSubmitEditing?: () => void;
        } = {}
    ) => (
        <View style={[
            styles.inputContainer,
            focusedField === field && styles.inputContainerFocused
        ]}>
            <Ionicons
                name={icon as any}
                size={20}
                color={focusedField === field ? brand.primary : neutral.steel}
                style={styles.inputIcon}
            />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={accessibleText.placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={options.secureTextEntry && !options.showPassword}
                keyboardType={options.keyboardType || 'default'}
                autoCapitalize={options.autoCapitalize || 'none'}
                autoCorrect={false}
                returnKeyType={options.returnKeyType || 'next'}
                onSubmitEditing={options.onSubmitEditing}
                onFocus={() => setFocusedField(field)}
                onBlur={() => setFocusedField(null)}
            />
            {options.secureTextEntry && (
                <TouchableOpacity
                    onPress={options.onTogglePassword}
                    style={styles.eyeIcon}
                    accessibilityLabel={options.showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    accessibilityRole="button"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={options.showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={accessibleText.placeholder}
                    />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.container}>
                <StatusBar style="light" />
                <ImageBackground
                    source={require('../../../assets/images/pyramid-background.png')}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                >
                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(13, 148, 136, 0.3)']}
                        style={StyleSheet.absoluteFill}
                    />

                    {/* Top Section - Branding */}
                    <View style={styles.brandingContainer}>
                        <Text style={styles.logo}>Kaelo</Text>
                        <View style={styles.taglineContainer}>
                            <LinearGradient
                                colors={[brand.primary, brand.gradient.end]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.taglineGradient}
                            >
                                <Text style={styles.tagline}>Explora Yucatán en dos ruedas</Text>
                            </LinearGradient>
                        </View>
                    </View>
                </ImageBackground>

                {/* Bottom Sheet - Register Form */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.formContainer}
                    keyboardVerticalOffset={0}
                >
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.scrollContent}
                        bounces={false}
                    >
                        <View style={styles.handle} />

                        <Text style={styles.welcomeTitle}>Crear cuenta</Text>
                        <Text style={styles.welcomeSubtitle}>Únete a la aventura.</Text>

                        {/* Name Input */}
                        <Text style={styles.inputLabel}>Nombre completo</Text>
                        {renderInput('name', 'person-outline', 'Tu nombre', name, setName, {
                            autoCapitalize: 'words',
                        })}

                        {/* Email Input */}
                        <Text style={styles.inputLabel}>Correo electrónico</Text>
                        {renderInput('email', 'mail-outline', 'aventurero@ejemplo.com', email, setEmail, {
                            keyboardType: 'email-address',
                        })}

                        {/* Password Input */}
                        <Text style={styles.inputLabel}>Contraseña</Text>
                        {renderInput('password', 'lock-closed-outline', 'Mínimo 6 caracteres', password, setPassword, {
                            secureTextEntry: true,
                            showPassword,
                            onTogglePassword: () => setShowPassword(!showPassword),
                        })}

                        {/* Confirm Password Input */}
                        <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                        {renderInput('confirmPassword', 'lock-closed-outline', 'Repite tu contraseña', confirmPassword, setConfirmPassword, {
                            secureTextEntry: true,
                            showPassword: showConfirmPassword,
                            onTogglePassword: () => setShowConfirmPassword(!showConfirmPassword),
                            returnKeyType: 'done',
                            onSubmitEditing: handleRegister,
                        })}

                        {/* Register Button with Gradient */}
                        <TouchableOpacity
                            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[brand.primary, brand.gradient.end]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.registerButtonGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color={neutral.white} />
                                ) : (
                                    <>
                                        <Text style={styles.registerButtonText}>Crear cuenta</Text>
                                        <View style={styles.buttonIconContainer}>
                                            <Ionicons name="arrow-forward" size={18} color={neutral.white} />
                                        </View>
                                    </>
                                )}
                            </LinearGradient>
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
        backgroundColor: neutral.snow,
    },
    backgroundImage: {
        height: height * 0.32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandingContainer: {
        alignItems: 'center',
        marginTop: -20,
    },
    logo: {
        fontSize: 46,
        fontWeight: '800',
        color: neutral.white,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 6,
        letterSpacing: -1,
    },
    taglineContainer: {
        marginTop: 10,
        borderRadius: radius.full,
        overflow: 'hidden',
    },
    taglineGradient: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    tagline: {
        color: neutral.white,
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    formContainer: {
        flex: 1,
        backgroundColor: neutral.white,
        borderTopLeftRadius: radius.xxl,
        borderTopRightRadius: radius.xxl,
        marginTop: -30,
        paddingHorizontal: 28,
        paddingTop: 14,
        ...shadows.large,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: neutral.silver,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 20,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: neutral.charcoal,
        textAlign: 'center',
        marginBottom: 6,
        letterSpacing: -0.5,
    },
    welcomeSubtitle: {
        fontSize: 15,
        color: neutral.slate,
        textAlign: 'center',
        marginBottom: 28,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: neutral.charcoal,
        marginBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.pearl,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        marginBottom: 16,
        height: 52,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputContainerFocused: {
        borderColor: brand.primary,
        backgroundColor: neutral.white,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: neutral.charcoal,
    },
    eyeIcon: {
        padding: touchTarget.padding,
        minWidth: touchTarget.min,
        minHeight: touchTarget.min,
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerButton: {
        borderRadius: radius.full,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 24,
        ...shadows.colored(brand.primary),
    },
    registerButtonDisabled: {
        opacity: 0.7,
    },
    registerButtonGradient: {
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    registerButtonText: {
        color: neutral.white,
        fontSize: 17,
        fontWeight: '700',
        marginRight: 10,
        letterSpacing: 0.3,
    },
    buttonIconContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
    },
    loginText: {
        color: neutral.slate,
        fontSize: 15,
    },
    loginLink: {
        color: brand.primary,
        fontSize: 15,
        fontWeight: '700',
    },
});
