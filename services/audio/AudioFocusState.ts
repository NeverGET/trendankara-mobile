/**
 * Audio focus states for handling audio interruptions
 * Used to manage playback behavior when other apps request audio focus
 */
export enum AudioFocusState {
  /** No audio focus - playback should be paused */
  NONE = 'none',
  /** Full audio focus - normal playback */
  GAIN = 'gain',
  /** Transient focus loss - temporary pause (e.g., notification) */
  LOSS_TRANSIENT = 'loss_transient',
  /** Transient focus loss with ducking - lower volume */
  LOSS_TRANSIENT_CAN_DUCK = 'loss_transient_can_duck',
  /** Permanent focus loss - pause and abandon focus */
  LOSS = 'loss'
}