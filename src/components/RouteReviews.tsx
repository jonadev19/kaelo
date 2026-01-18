/**
 * Route Reviews Component
 * Shows reviews and allows users to add new reviews
 */

import { brand, neutral, semantic } from "@/constants/Colors";
import {
    createReview,
    deleteReview,
    getRouteReviews,
    getUserReview,
    RouteReview,
} from "@/services/reviews";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface RouteReviewsProps {
  routeId: string;
  hasAccess: boolean;
}

export default function RouteReviews({
  routeId,
  hasAccess,
}: RouteReviewsProps) {
  const [reviews, setReviews] = useState<RouteReview[]>([]);
  const [userReview, setUserReview] = useState<RouteReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reviewsData, userReviewData] = await Promise.all([
        getRouteReviews(routeId),
        getUserReview(routeId),
      ]);
      setReviews(reviewsData);
      setUserReview(userReviewData);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleSubmitReview = async () => {
    if (rating < 1 || rating > 5) {
      Alert.alert("Error", "Selecciona una calificación válida");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createReview({
        routeId,
        rating,
        comment: comment.trim() || undefined,
      });

      if (result.success) {
        setShowModal(false);
        setRating(5);
        setComment("");
        loadReviews();
        Alert.alert("¡Gracias!", "Tu reseña ha sido publicada");
      } else {
        Alert.alert("Error", result.error || "No se pudo publicar la reseña");
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = () => {
    if (!userReview) return;

    Alert.alert("Eliminar reseña", "¿Seguro que quieres eliminar tu reseña?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          const result = await deleteReview(userReview.id);
          if (result.success) {
            loadReviews();
          } else {
            Alert.alert("Error", result.error || "No se pudo eliminar");
          }
        },
      },
    ]);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (count: number, interactive = false, size = 16) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setRating(star)}
            disabled={!interactive}
            style={interactive ? styles.starButton : undefined}
          >
            <Ionicons
              name={star <= count ? "star" : "star-outline"}
              size={size}
              color="#FBBF24"
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderReviewItem = ({ item }: { item: RouteReview }) => {
    const isOwnReview = userReview?.id === item.id;

    return (
      <View style={[styles.reviewItem, isOwnReview && styles.ownReviewItem]}>
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.userName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View>
              <Text style={styles.reviewerName}>{item.userName}</Text>
              <Text style={styles.reviewDate}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
          </View>
          <View style={styles.reviewRating}>{renderStars(item.rating)}</View>
        </View>
        {item.comment && (
          <Text style={styles.reviewComment}>{item.comment}</Text>
        )}
        {isOwnReview && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteReview}
          >
            <Ionicons name="trash-outline" size={14} color={semantic.error} />
            <Text style={styles.deleteButtonText}>Eliminar mi reseña</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={brand.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Reseñas ({reviews.length})</Text>
        {hasAccess && !userReview && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={18} color={brand.primary} />
            <Text style={styles.addButtonText}>Escribir reseña</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="chatbubble-outline"
            size={32}
            color={neutral.gray400}
          />
          <Text style={styles.emptyText}>Aún no hay reseñas</Text>
          {hasAccess && !userReview && (
            <Text style={styles.emptySubtext}>
              ¡Sé el primero en dejar una reseña!
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={renderReviewItem}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Add Review Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tu Reseña</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={neutral.gray600} />
              </TouchableOpacity>
            </View>

            <Text style={styles.ratingLabel}>Calificación</Text>
            <View style={styles.ratingSelector}>
              {renderStars(rating, true, 32)}
            </View>

            <Text style={styles.commentLabel}>Comentario (opcional)</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Comparte tu experiencia con esta ruta..."
              placeholderTextColor={neutral.gray400}
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={500}
            />
            <Text style={styles.charCount}>{comment.length}/500</Text>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={neutral.white} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={neutral.white} />
                  <Text style={styles.submitButtonText}>Publicar Reseña</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: neutral.gray800,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: brand.primaryLight,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: brand.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 15,
    color: neutral.gray500,
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 13,
    color: neutral.gray400,
  },
  reviewItem: {
    paddingVertical: 12,
  },
  ownReviewItem: {
    backgroundColor: brand.primaryLight,
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brand.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: neutral.white,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.gray800,
  },
  reviewDate: {
    fontSize: 12,
    color: neutral.gray500,
  },
  reviewRating: {
    flexDirection: "row",
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  starButton: {
    padding: 4,
  },
  reviewComment: {
    marginTop: 10,
    fontSize: 14,
    color: neutral.gray700,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingVertical: 4,
  },
  deleteButtonText: {
    fontSize: 12,
    color: semantic.error,
  },
  separator: {
    height: 1,
    backgroundColor: neutral.gray200,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: neutral.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: neutral.gray800,
  },
  closeButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.gray700,
    marginBottom: 8,
  },
  ratingSelector: {
    alignItems: "center",
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.gray700,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: neutral.gray300,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: neutral.gray800,
    minHeight: 100,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: neutral.gray400,
    marginTop: 4,
    marginBottom: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: brand.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: neutral.white,
  },
});
