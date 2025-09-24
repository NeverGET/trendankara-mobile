export enum AudioError {
  NETWORK_ERROR = 'NETWORK_ERROR',
  STREAM_UNAVAILABLE = 'STREAM_UNAVAILABLE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  AUDIO_FOCUS_LOST = 'AUDIO_FOCUS_LOST',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AudioErrorHandler {
  static handleError(error: any): { type: AudioError; message: string } {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return {
        type: AudioError.NETWORK_ERROR,
        message: 'İnternet bağlantısı yok',
      };
    }

    if (errorMessage.includes('404') || errorMessage.includes('stream') || errorMessage.includes('unavailable')) {
      return {
        type: AudioError.STREAM_UNAVAILABLE,
        message: 'Yayın şu anda kullanılamıyor',
      };
    }

    if (errorMessage.includes('permission')) {
      return {
        type: AudioError.PERMISSION_DENIED,
        message: 'Ses izni gerekli',
      };
    }

    if (errorMessage.includes('focus') || errorMessage.includes('interrupted')) {
      return {
        type: AudioError.AUDIO_FOCUS_LOST,
        message: 'Ses kesintiye uğradı',
      };
    }

    return {
      type: AudioError.UNKNOWN_ERROR,
      message: 'Bir hata oluştu. Lütfen tekrar deneyin',
    };
  }

  static shouldRetry(errorType: AudioError): boolean {
    return errorType === AudioError.NETWORK_ERROR ||
           errorType === AudioError.STREAM_UNAVAILABLE;
  }

  static getRetryDelay(errorType: AudioError, attemptNumber: number): number {
    const baseDelay = 2000;
    const maxDelay = 10000;

    if (!this.shouldRetry(errorType)) {
      return 0;
    }

    // Exponential backoff with jitter
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
    const jitter = Math.random() * 1000;

    return exponentialDelay + jitter;
  }
}