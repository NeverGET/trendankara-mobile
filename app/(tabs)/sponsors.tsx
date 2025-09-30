import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, ActivityIndicator, Linking, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CardsGrid from '@/components/cards/CardsGrid';
import { EmptyState } from '@/components/common/EmptyState';
import { CustomModal, type ModalAction } from '@/components/common/CustomModal';
import { createScreenStyles } from '@/constants/screenStyles';
import { Colors, Spacing } from '@/constants/themes';
import { FEATURES } from '@/constants/config';
import { cardsService } from '@/services/api/cards';
import type { ContentCard } from '@/types/models';
import * as Haptics from 'expo-haptics';

export default function SponsorsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const screenStyles = createScreenStyles(colorScheme ?? 'light');
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  const handleCardPress = (card: ContentCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCard(card);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedCard(null);
  };

  const toggleDisplayMode = () => {
    setDisplayMode(prev => prev === 'grid' ? 'list' : 'grid');
  };

  const handleContactAction = async (type: string, value: string) => {
    try {
      let url = '';

      switch (type) {
        case 'phone':
          url = `tel:${value}`;
          break;
        case 'whatsapp':
          // Format phone number for WhatsApp (remove non-numeric characters)
          const whatsappNumber = value.replace(/\D/g, '');
          url = `whatsapp://send?phone=${whatsappNumber}`;
          break;
        case 'email':
          url = `mailto:${value}`;
          break;
        case 'website':
          url = value.startsWith('http') ? value : `https://${value}`;
          break;
        case 'instagram':
          // Handle Instagram username or URL
          const instagramUsername = value.replace('@', '').replace('https://instagram.com/', '');
          url = `instagram://user?username=${instagramUsername}`;
          // Fallback to web URL
          const webUrl = `https://instagram.com/${instagramUsername}`;

          // Try to open Instagram app, fallback to web
          const canOpen = await Linking.canOpenURL(url);
          if (!canOpen) {
            url = webUrl;
          }
          break;
        case 'location':
          // Open in maps
          const encodedAddress = encodeURIComponent(value);
          url = `https://maps.google.com/?q=${encodedAddress}`;
          break;
        default:
          console.warn('Unknown contact action type:', type);
          return;
      }

      if (url) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening contact action:', error);
      Alert.alert('Hata', 'İletişim bilgisi açılırken bir hata oluştu');
    }
  };

  const getModalActions = (card: ContentCard): ModalAction[] => {
    const actions: ModalAction[] = [];

    // Phone
    if (card.phoneNumber) {
      actions.push({
        label: 'Ara',
        icon: 'call',
        variant: 'primary',
        onPress: () => handleContactAction('phone', card.phoneNumber!),
      });
    }

    // WhatsApp
    if (card.whatsappNumber || card.phoneNumber) {
      const whatsappNum = card.whatsappNumber || card.phoneNumber;
      actions.push({
        label: 'WhatsApp',
        icon: 'logo-whatsapp',
        variant: 'primary',
        onPress: () => handleContactAction('whatsapp', whatsappNum!),
      });
    }

    // Email
    if (card.email) {
      actions.push({
        label: 'E-posta',
        icon: 'mail',
        variant: 'outline',
        onPress: () => handleContactAction('email', card.email!),
      });
    }

    // Website
    if (card.websiteUrl) {
      actions.push({
        label: 'Web Sitesi',
        icon: 'globe',
        variant: 'outline',
        onPress: () => handleContactAction('website', card.websiteUrl!),
      });
    }

    // Instagram
    if (card.instagramUsername) {
      actions.push({
        label: 'Instagram',
        icon: 'logo-instagram',
        variant: 'outline',
        onPress: () => handleContactAction('instagram', card.instagramUsername!),
      });
    }

    // Location
    if (card.locationAddress) {
      actions.push({
        label: 'Konum',
        icon: 'location',
        variant: 'outline',
        onPress: () => handleContactAction('location', card.locationAddress!),
      });
    }

    return actions;
  };

  useEffect(() => {
    const loadCards = async () => {
      try {
        setLoading(true);
        const allCards = await cardsService.getAllCards();
        setCards(allCards);
      } catch (error) {
        console.error('Failed to load cards:', error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
        <View style={screenStyles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Sponsorlar yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && cards.length === 0) {
    return (
      <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
        <View style={screenStyles.emptyContainer}>
          <EmptyState
            message="Sponsor bulunmamaktadır"
            icon="business-outline"
            subtitle="Henüz sponsor kartı eklenmemiş"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={screenStyles.container} edges={['top', 'left', 'right']}>
      <View style={[screenStyles.headerContainer, styles.headerWithToggle]}>
        <View style={styles.headerLeft}>
          <Text style={screenStyles.pageTitle}>Sponsorlar</Text>
          <Text style={screenStyles.pageSubtitle}>İş ortaklarımız ve destekçilerimiz</Text>
        </View>
        <TouchableOpacity onPress={toggleDisplayMode} style={styles.toggleButton}>
          <Ionicons
            name={displayMode === 'grid' ? 'list' : 'grid'}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>
      <CardsGrid
        onCardPress={handleCardPress}
        displayMode={displayMode}
        hideHeader={true}
      />

      {/* Custom Modal */}
      {selectedCard && (
        <CustomModal
          visible={modalVisible}
          onClose={handleCloseModal}
          title={selectedCard.title}
          description={selectedCard.description}
          imageUrl={selectedCard.imageUrl}
          actions={getModalActions(selectedCard)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingText: {
    marginTop: 10,
    opacity: 0.6,
    fontSize: 14,
  },
  headerWithToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  toggleButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.md,
  },
});