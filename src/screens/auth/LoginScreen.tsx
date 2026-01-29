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

export function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const { signIn } = useAuth();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(tabs)');
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

                {/* Bottom Sheet - Login Form */}
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

                        <Text style={styles.welcomeTitle}>Bienvenido</Text>
                        <Text style={styles.welcomeSubtitle}>Tu aventura comienza aquí.</Text>

                        {/* Email Input */}
                        <Text style={styles.inputLabel}>Correo electrónico</Text>
                        <View style={[
                            styles.inputContainer,
                            emailFocused && styles.inputContainerFocused
                        ]}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color={emailFocused ? brand.primary : neutral.steel}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="aventurero@ejemplo.com"
                                placeholderTextColor={accessibleText.placeholder}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                            />
                        </View>

                        {/* Password Input */}
                        <Text style={styles.inputLabel}>Contraseña</Text>
                        <View style={[
                            styles.inputContainer,
                            passwordFocused && styles.inputContainerFocused
                        ]}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color={passwordFocused ? brand.primary : neutral.steel}
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="••••••••"
                                placeholderTextColor={accessibleText.placeholder}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize="none"
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeIcon}
                                accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                accessibilityRole="button"
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={accessibleText.placeholder}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
                        </TouchableOpacity>

                        {/* Login Button with Gradient */}
                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            <LinearGradient
                                colors={[brand.primary, brand.gradient.end]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.loginButtonGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color={neutral.white} />
                                ) : (
                                    <>
                                        <Text style={styles.loginButtonText}>Entrar</Text>
                                        <View style={styles.buttonIconContainer}>
                                            <Ionicons name="arrow-forward" size={18} color={neutral.white} />
                                        </View>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                            <Link href="/register" asChild>
                                <TouchableOpacity>
                                    <Text style={styles.registerLink}>Regístrate</Text>
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
        height: height * 0.38,
        justifyContent: 'center',
        alignItems: 'center',
    },
    brandingContainer: {
        alignItems: 'center',
        marginTop: -40,
    },
    logo: {
        fontSize: 52,
        fontWeight: '800',
        color: neutral.white,
        textShadowColor: 'rgba(0, 0, 0, 0.4)',
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 6,
        letterSpacing: -1,
    },
    taglineContainer: {
        marginTop: 12,
        borderRadius: radius.full,
        overflow: 'hidden',
    },
    taglineGradient: {
        paddingHorizontal: 24,
        paddingVertical: 10,
    },
    tagline: {
        color: neutral.white,
        fontSize: 14,
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
        paddingTop: 16,
        ...shadows.large,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 40,
    },
    handle: {
        width: 40,
        height: 5,
        backgroundColor: neutral.silver,
        borderRadius: 3,
        alignSelf: 'center',
        marginBottom: 24,
    },
    welcomeTitle: {
        fontSize: 30,
        fontWeight: '700',
        color: neutral.charcoal,
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: neutral.slate,
        textAlign: 'center',
        marginBottom: 36,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: neutral.charcoal,
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: neutral.pearl,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        marginBottom: 18,
        height: 56,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputContainerFocused: {
        borderColor: brand.primary,
        backgroundColor: neutral.white,
    },
    inputIcon: {
        marginRight: 14,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: neutral.charcoal,
    },
    eyeIcon: {
        padding: touchTarget.padding,
        minWidth: touchTarget.min,
        minHeight: touchTarget.min,
        justifyContent: 'center',
        alignItems: 'center',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 28,
    },
    forgotPasswordText: {
        color: neutral.slate,
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        borderRadius: radius.full,
        overflow: 'hidden',
        marginBottom: 28,
        ...shadows.colored(brand.primary),
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonGradient: {
        height: 58,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    loginButtonText: {
        color: neutral.white,
        fontSize: 18,
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
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    registerText: {
        color: neutral.slate,
        fontSize: 15,
    },
    registerLink: {
        color: brand.primary,
        fontSize: 15,
        fontWeight: '700',
    },
});
