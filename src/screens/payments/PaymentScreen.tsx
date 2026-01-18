/**
 * Payment Screen
 * Mock payment UI for MVP
 */

import { processRoutePayment } from "@/services/payments";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PaymentScreen() {
  const params = useLocalSearchParams<{
    routeId: string;
    routeName: string;
    amount: string;
  }>();

  const routeId = params.routeId;
  const routeName = params.routeName || "Ruta";
  const amount = parseFloat(params.amount || "0");

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const formatted = cleaned.replace(/(.{4})/g, "$1 ").trim();
    setCardNumber(formatted);
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 2) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const formatCvv = (text: string) => {
    setCvv(text.replace(/\D/g, "").slice(0, 4));
  };

  const validateCard = (): boolean => {
    const cardClean = cardNumber.replace(/\s/g, "");
    if (cardClean.length < 15) {
      Alert.alert("Error", "Número de tarjeta inválido");
      return false;
    }
    if (expiry.length < 5) {
      Alert.alert("Error", "Fecha de expiración inválida");
      return false;
    }
    if (cvv.length < 3) {
      Alert.alert("Error", "CVV inválido");
      return false;
    }
    if (cardHolder.trim().length < 3) {
      Alert.alert("Error", "Ingresa el nombre del titular");
      return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validateCard()) return;
    if (!routeId) {
      Alert.alert("Error", "No se encontró la ruta");
      return;
    }

    setProcessing(true);

    const result = await processRoutePayment(routeId, amount, {
      cardNumber: cardNumber.replace(/\s/g, ""),
      expiry,
      cvv,
      cardHolder,
    });

    setProcessing(false);

    if (result.success) {
      Alert.alert(
        "¡Pago Exitoso!",
        `Tu compra ha sido procesada.\n\nID de transacción:\n${result.transactionId}`,
        [
          {
            text: "Ir a la Ruta",
            onPress: () => {
              // Go back twice to RouteDetailScreen, which will reload
              router.back();
              router.back();
              // Navigate to the route again to refresh
              setTimeout(() => {
                router.push(`/route/${routeId}`);
              }, 100);
            },
          },
        ],
      );
    } else {
      Alert.alert(
        "Error en el Pago",
        result.error || "No se pudo procesar el pago",
      );
    }
  };

  const getCardIcon = () => {
    const firstDigit = cardNumber.replace(/\s/g, "")[0];
    if (firstDigit === "4") return "cc-visa";
    if (firstDigit === "5") return "cc-mastercard";
    if (firstDigit === "3") return "cc-amex";
    return "credit-card";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pagar</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Order Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ruta</Text>
              <Text style={styles.summaryValue} numberOfLines={1}>
                {routeName}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total a pagar</Text>
              <Text style={styles.totalValue}>${amount.toFixed(0)} MXN</Text>
            </View>
          </View>

          {/* Card Preview */}
          <View style={styles.cardPreview}>
            <View style={styles.cardGradient}>
              <View style={styles.cardHeader}>
                <FontAwesome name={getCardIcon()} size={32} color="#fff" />
                <Text style={styles.cardChip}>💳</Text>
              </View>
              <Text style={styles.cardNumberPreview}>
                {cardNumber || "•••• •••• •••• ••••"}
              </Text>
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.cardLabel}>TITULAR</Text>
                  <Text style={styles.cardValue}>
                    {cardHolder.toUpperCase() || "NOMBRE APELLIDO"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.cardLabel}>EXPIRA</Text>
                  <Text style={styles.cardValue}>{expiry || "MM/YY"}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Card Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Número de Tarjeta</Text>
              <View style={styles.inputWithIcon}>
                <TextInput
                  style={styles.input}
                  value={cardNumber}
                  onChangeText={formatCardNumber}
                  placeholder="1234 5678 9012 3456"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={19}
                  autoComplete="off"
                  textContentType="none"
                />
                <FontAwesome
                  name={getCardIcon()}
                  size={24}
                  color="#666"
                  style={styles.inputIcon}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nombre del Titular</Text>
              <TextInput
                style={styles.inputFull}
                value={cardHolder}
                onChangeText={(text) => setCardHolder(text.toUpperCase())}
                placeholder="Como aparece en la tarjeta"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                textContentType="none"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}>
                <Text style={styles.label}>Expiración</Text>
                <TextInput
                  style={[styles.inputFull, { textAlign: "center" }]}
                  value={expiry}
                  onChangeText={formatExpiry}
                  placeholder="MM/YY"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  maxLength={5}
                  autoComplete="off"
                  textContentType="none"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>CVV</Text>
                <View style={styles.inputWithIcon}>
                  <TextInput
                    style={styles.input}
                    value={cvv}
                    onChangeText={formatCvv}
                    placeholder="123"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    autoComplete="off"
                    textContentType="none"
                  />
                  <Ionicons
                    name="help-circle-outline"
                    size={20}
                    color="#999"
                    style={styles.inputIcon}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Security Notice */}
          <View style={styles.securityNotice}>
            <Ionicons name="shield-checkmark" size={20} color="#4CAF50" />
            <Text style={styles.securityText}>
              Pago seguro. Tus datos están protegidos.
            </Text>
          </View>

          {/* Demo Notice */}
          <View style={styles.demoNotice}>
            <Ionicons name="information-circle" size={18} color="#FF9800" />
            <Text style={styles.demoText}>
              Modo demo: Ingresa cualquier dato para simular el pago.
            </Text>
          </View>
        </ScrollView>

        {/* Pay Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.payButton, processing && styles.payButtonDisabled]}
            onPress={handlePayment}
            disabled={processing}
          >
            {processing ? (
              <View style={styles.processingRow}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.payButtonText}>Procesando...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="lock-closed" size={20} color="#fff" />
                <Text style={styles.payButtonText}>
                  Pagar ${amount.toFixed(0)} MXN
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
    textAlign: "right",
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4CAF50",
  },
  cardPreview: {
    marginBottom: 24,
  },
  cardGradient: {
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 20,
    minHeight: 180,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardChip: {
    fontSize: 24,
  },
  cardNumberPreview: {
    fontSize: 22,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#fff",
    letterSpacing: 2,
    marginVertical: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardLabel: {
    fontSize: 10,
    color: "#888",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },
  form: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: "#333",
  },
  inputFull: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#333",
  },
  inputIcon: {
    paddingRight: 14,
  },
  inputRow: {
    flexDirection: "row",
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  securityText: {
    fontSize: 13,
    color: "#666",
  },
  demoNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E0",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  demoText: {
    fontSize: 12,
    color: "#E65100",
    flex: 1,
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  payButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  payButtonDisabled: {
    backgroundColor: "#a5d6a7",
  },
  payButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  processingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});
