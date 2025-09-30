/**
 * Share Functionality
 * Handle sharing for news, polls, and app content
 * Trend Ankara Mobile Application
 */

import { Share, Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { DeepLinkHelper } from './navigation';
import type { NewsArticle, Poll } from '@/types/models';

// Share options
interface ShareOptions {
  title?: string;
  message?: string;
  url?: string;
  dialogTitle?: string;
  subject?: string; // For email sharing
  excludedActivityTypes?: string[];
}

// Share result
interface ShareResult {
  success: boolean;
  activityType?: string;
  error?: string;
}

// Share content types
export type ShareableContent = {
  type: 'article';
  data: NewsArticle;
} | {
  type: 'poll';
  data: Poll;
} | {
  type: 'app';
  data?: undefined;
} | {
  type: 'custom';
  data: {
    title: string;
    message: string;
    url?: string;
  };
};

/**
 * Share Service Class
 */
export class ShareService {
  private static readonly APP_NAME = 'Trend Ankara';
  private static readonly APP_STORE_URL = 'https://apps.apple.com/app/trend-ankara'; // Replace with actual URL
  private static readonly PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.trendankara.mobile'; // Replace with actual URL

  /**
   * Share content using native share dialog
   */
  static async shareContent(content: ShareableContent): Promise<ShareResult> {
    try {
      const shareOptions = this.prepareShareOptions(content);

      if (!shareOptions) {
        throw new Error('Could not prepare share options');
      }

      // Use native Share API
      const result = await Share.share(shareOptions, {
        dialogTitle: shareOptions.dialogTitle,
        excludedActivityTypes: shareOptions.excludedActivityTypes,
        subject: shareOptions.subject,
      });

      if (result.action === Share.sharedAction) {
        return {
          success: true,
          activityType: result.activityType || undefined,
        };
      } else if (result.action === Share.dismissedAction) {
        return {
          success: false,
          error: 'Share dismissed by user',
        };
      }

      return { success: false, error: 'Unknown share result' };
    } catch (error) {
      console.error('Share error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Share failed',
      };
    }
  }

  /**
   * Prepare share options based on content type
   */
  private static prepareShareOptions(content: ShareableContent): ShareOptions | null {
    switch (content.type) {
      case 'article':
        return this.prepareArticleShare(content.data);
      case 'poll':
        return this.preparePollShare(content.data);
      case 'app':
        return this.prepareAppShare();
      case 'custom':
        return this.prepareCustomShare(content.data);
      default:
        return null;
    }
  }

  /**
   * Prepare article sharing
   */
  private static prepareArticleShare(article: NewsArticle): ShareOptions {
    const url = DeepLinkHelper.generateShareUrl(`article/${article.id}`, {
      utm_source: 'mobile_app',
      utm_medium: 'share',
      utm_campaign: 'article_share',
    });

    return {
      title: article.title,
      message: `${article.title}\n\n${article.excerpt}\n\n${this.APP_NAME} uygulamasında okuyun: ${url}`,
      url,
      dialogTitle: 'Makaleyi Paylaş',
      subject: `${this.APP_NAME} - ${article.title}`,
    };
  }

  /**
   * Prepare poll sharing
   */
  private static preparePollShare(poll: Poll): ShareOptions {
    const url = DeepLinkHelper.generateShareUrl(`poll/${poll.id}`, {
      utm_source: 'mobile_app',
      utm_medium: 'share',
      utm_campaign: 'poll_share',
    });

    const totalVotes = poll.totalVotes;
    const voteText = totalVotes === 1 ? 'oy' : 'oy';

    return {
      title: poll.question,
      message: `${poll.question}\n\n${totalVotes} ${voteText} ile devam eden ankete katılın!\n\n${this.APP_NAME}: ${url}`,
      url,
      dialogTitle: 'Anketi Paylaş',
      subject: `${this.APP_NAME} - ${poll.question}`,
    };
  }

  /**
   * Prepare app sharing
   */
  private static prepareAppShare(): ShareOptions {
    const storeUrl = Platform.OS === 'ios' ? this.APP_STORE_URL : this.PLAY_STORE_URL;

    return {
      title: this.APP_NAME,
      message: `${this.APP_NAME} uygulamasını indir ve en son haberleri takip et, anketlere katıl!\n\n${storeUrl}`,
      url: storeUrl,
      dialogTitle: 'Uygulamayı Paylaş',
      subject: `${this.APP_NAME} - Radyo Uygulaması`,
    };
  }

  /**
   * Prepare custom sharing
   */
  private static prepareCustomShare(data: { title: string; message: string; url?: string }): ShareOptions {
    return {
      title: data.title,
      message: data.url ? `${data.message}\n\n${data.url}` : data.message,
      url: data.url,
      dialogTitle: 'Paylaş',
      subject: data.title,
    };
  }

  /**
   * Share to specific platform (if supported)
   */
  static async shareToWhatsApp(content: ShareableContent): Promise<ShareResult> {
    try {
      const shareOptions = this.prepareShareOptions(content);
      if (!shareOptions) {
        throw new Error('Could not prepare share options');
      }

      // WhatsApp sharing
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareOptions.message || '')}`;

      // Check if WhatsApp is available
      const canOpen = await WebBrowser.maybeCompleteAuthSession();

      if (canOpen) {
        await WebBrowser.openBrowserAsync(whatsappUrl);
        return { success: true, activityType: 'whatsapp' };
      } else {
        // Fallback to regular share
        return this.shareContent(content);
      }
    } catch (error) {
      console.error('WhatsApp share error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'WhatsApp share failed',
      };
    }
  }

  /**
   * Share to Twitter/X
   */
  static async shareToTwitter(content: ShareableContent): Promise<ShareResult> {
    try {
      const shareOptions = this.prepareShareOptions(content);
      if (!shareOptions) {
        throw new Error('Could not prepare share options');
      }

      const tweetText = shareOptions.message || '';
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

      await WebBrowser.openBrowserAsync(twitterUrl);
      return { success: true, activityType: 'twitter' };
    } catch (error) {
      console.error('Twitter share error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Twitter share failed',
      };
    }
  }

  /**
   * Copy to clipboard
   */
  static async copyToClipboard(content: ShareableContent): Promise<ShareResult> {
    try {
      // We'll need to import Clipboard or use Expo's clipboard
      // For now, we'll use a mock implementation
      const shareOptions = this.prepareShareOptions(content);
      if (!shareOptions) {
        throw new Error('Could not prepare share options');
      }

      // In a real implementation, you'd use:
      // import * as Clipboard from 'expo-clipboard';
      // await Clipboard.setStringAsync(shareOptions.message || '');

      console.log('Copied to clipboard:', shareOptions.message);

      return { success: true, activityType: 'clipboard' };
    } catch (error) {
      console.error('Clipboard error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Copy to clipboard failed',
      };
    }
  }

  /**
   * Generate share analytics data
   */
  static generateShareAnalytics(content: ShareableContent, result: ShareResult) {
    return {
      content_type: content.type,
      content_id: content.type === 'article' ? content.data.id :
                  content.type === 'poll' ? content.data.id : null,
      share_success: result.success,
      share_method: result.activityType || 'unknown',
      timestamp: Date.now(),
      platform: Platform.OS,
    };
  }
}

/**
 * Share Button Components Helper
 */
export class ShareButtonHelper {
  /**
   * Get platform-specific share text
   */
  static getShareText(platform: 'ios' | 'android' | 'web'): string {
    switch (platform) {
      case 'ios':
        return 'Paylaş';
      case 'android':
        return 'Paylaş';
      case 'web':
        return 'Paylaş';
      default:
        return 'Paylaş';
    }
  }

  /**
   * Get share options for UI
   */
  static getShareOptions() {
    return [
      {
        id: 'native',
        label: 'Paylaş',
        icon: 'share',
        action: (content: ShareableContent) => ShareService.shareContent(content),
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        icon: 'logo-whatsapp',
        action: (content: ShareableContent) => ShareService.shareToWhatsApp(content),
      },
      {
        id: 'twitter',
        label: 'Twitter',
        icon: 'logo-twitter',
        action: (content: ShareableContent) => ShareService.shareToTwitter(content),
      },
      {
        id: 'clipboard',
        label: 'Kopyala',
        icon: 'copy',
        action: (content: ShareableContent) => ShareService.copyToClipboard(content),
      },
    ];
  }

  /**
   * Show share action sheet
   */
  static showShareActionSheet(content: ShareableContent) {
    const options = this.getShareOptions();
    const actionTitles = options.map(option => option.label);

    Alert.alert(
      'Paylaş',
      'Nasıl paylaşmak istersiniz?',
      [
        ...options.map((option, index) => ({
          text: option.label,
          onPress: () => option.action(content),
        })),
        {
          text: 'İptal',
          style: 'cancel' as const,
        },
      ]
    );
  }
}

/**
 * Share Tracking Helper
 */
export class ShareTracker {
  private static shareHistory: Array<{
    content: ShareableContent;
    result: ShareResult;
    timestamp: number;
  }> = [];

  /**
   * Track share event
   */
  static trackShare(content: ShareableContent, result: ShareResult) {
    this.shareHistory.push({
      content,
      result,
      timestamp: Date.now(),
    });

    // Keep only last 100 shares
    if (this.shareHistory.length > 100) {
      this.shareHistory = this.shareHistory.slice(-100);
    }

    // Generate analytics
    const analytics = ShareService.generateShareAnalytics(content, result);
    console.log('Share analytics:', analytics);

    // In a real app, send to analytics service
    // AnalyticsService.track('share_content', analytics);
  }

  /**
   * Get share statistics
   */
  static getShareStats() {
    const total = this.shareHistory.length;
    const successful = this.shareHistory.filter(share => share.result.success).length;
    const byType = this.shareHistory.reduce((acc, share) => {
      acc[share.content.type] = (acc[share.content.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      successful,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      byType,
      recentShares: this.shareHistory.slice(-10),
    };
  }
}

/**
 * Usage Examples:
 *
 * Share an article:
 * ```tsx
 * const shareArticle = async (article: NewsArticle) => {
 *   const result = await ShareService.shareContent({
 *     type: 'article',
 *     data: article
 *   });
 *
 *   ShareTracker.trackShare({ type: 'article', data: article }, result);
 * };
 * ```
 *
 * Share a poll:
 * ```tsx
 * const sharePoll = async (poll: Poll) => {
 *   const result = await ShareService.shareContent({
 *     type: 'poll',
 *     data: poll
 *   });
 *
 *   if (result.success) {
 *     console.log('Poll shared successfully!');
 *   }
 * };
 * ```
 *
 * Show share options:
 * ```tsx
 * const handleShare = (article: NewsArticle) => {
 *   ShareButtonHelper.showShareActionSheet({
 *     type: 'article',
 *     data: article
 *   });
 * };
 * ```
 *
 * Share to specific platform:
 * ```tsx
 * const shareToWhatsApp = async (poll: Poll) => {
 *   const result = await ShareService.shareToWhatsApp({
 *     type: 'poll',
 *     data: poll
 *   });
 * };
 * ```
 */