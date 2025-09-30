/**
 * ContentCard Component
 * Display individual content card with image and actions
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Dimensions,
  useColorScheme,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { ContentCard as ContentCardType } from '@/types/api';
import { getImageSource, getPlaceholderImage } from '@/utils/imageProxy';

interface ContentCardProps {
  card: ContentCardType;
  onPress?: () => void;
  displayMode?: 'grid' | 'list';
}

const { width } = Dimensions.get('window');
// Calculate card width for 2 columns with padding
const CARD_WIDTH = (width - 32 - 12) / 2; // 32 for padding (16*2), 12 for gap

export const ContentCard: React.FC<ContentCardProps> = ({
  card,
  onPress,
  displayMode = 'grid',
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isExpired = () => {
    if (!card.endTime) return false;
    return new Date(card.endTime) < new Date();
  };

  const handlePhone = () => {
    if (!card.contactPhone) return;

    const phoneNumber = card.contactPhone.replace(/[^0-9]/g, '');
    const url = `tel:${phoneNumber}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'Telefon araması yapılamıyor');
      }
    });
  };

  const handleWhatsApp = () => {
    if (!card.contactWhatsapp) return;

    const phoneNumber = card.contactWhatsapp.replace(/[^0-9]/g, '');
    const message = `Merhaba, ${card.title} ilanınız hakkında bilgi almak istiyorum.`;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Hata', 'WhatsApp açılamıyor');
      }
    });
  };

  const handleEmail = () => {
    if (!card.contactEmail) return;

    const subject = `${card.title} Hakkında`;
    const body = `Merhaba,\n\n${card.title} ilanınız hakkında bilgi almak istiyorum.\n\n`;
    const url = `mailto:${card.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    Linking.openURL(url);
  };

  const handleInstagram = () => {
    if (!card.contactInstagram) return;

    const username = card.contactInstagram.replace('@', '');
    const url = `instagram://user?username=${username}`;
    const webUrl = `https://instagram.com/${username}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(webUrl);
      }
    });
  };

  const handleLocation = () => {
    if (!card.locationLat || !card.locationLng) return;

    const url = `https://maps.google.com/?q=${card.locationLat},${card.locationLng}`;
    Linking.openURL(url);
  };

  const cardStyle = displayMode === 'list' ? styles.cardList : styles.cardGrid;
  const imageStyle = displayMode === 'list' ? styles.imageList : styles.imageGrid;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        cardStyle,
        { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' },
        isExpired() && styles.cardExpired
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {card.imageUrl ? (
        <Image
          source={getImageSource(card.imageUrl) || { uri: getPlaceholderImage() }}
          style={imageStyle}
          contentFit="cover"
          transition={300}
          placeholder={{ uri: getPlaceholderImage() }}
          recyclingKey={card.id.toString()}
          cachePolicy="memory-disk"
          priority="low"
        />
      ) : (
        <View style={[imageStyle, styles.placeholderImage, { backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}>
          <Ionicons name="image-outline" size={40} color={isDark ? "#666666" : "#999999"} />
        </View>
      )}

      {card.isFeatured && (
        <View style={styles.featuredBadge}>
          <Text style={styles.featuredText}>ÖNE ÇIKAN</Text>
        </View>
      )}

      {isExpired() && (
        <View style={styles.expiredOverlay}>
          <Text style={styles.expiredText}>SÜRESİ DOLDU</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: isDark ? '#E6E6E6' : '#333333' }]} numberOfLines={2}>
          {card.title}
        </Text>

        {card.description && (
          <Text style={[styles.description, { color: isDark ? '#999999' : '#666666' }]} numberOfLines={3}>
            {card.description}
          </Text>
        )}

        <View style={styles.actions}>
          {card.contactPhone && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }]} onPress={handlePhone}>
              <Ionicons name="call" size={20} color="#FF0000" />
            </TouchableOpacity>
          )}

          {card.contactWhatsapp && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }]} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </TouchableOpacity>
          )}

          {card.contactEmail && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }]} onPress={handleEmail}>
              <Ionicons name="mail" size={20} color="#FF0000" />
            </TouchableOpacity>
          )}

          {card.contactInstagram && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }]} onPress={handleInstagram}>
              <Ionicons name="logo-instagram" size={20} color="#E4405F" />
            </TouchableOpacity>
          )}

          {(card.locationLat && card.locationLng) && (
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0' }]} onPress={handleLocation}>
              <Ionicons name="location" size={20} color="#FF0000" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGrid: {
    width: CARD_WIDTH,
  },
  cardList: {
    width: '100%',
  },
  cardExpired: {
    opacity: 0.6,
  },
  imageGrid: {
    width: '100%',
    height: 120,
  },
  imageList: {
    width: '100%',
    height: 200,
  },
  featuredBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF0000',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 1,
  },
  featuredText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  expiredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  expiredText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ContentCard;