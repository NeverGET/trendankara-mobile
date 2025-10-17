/**
 * Notification Click Handler
 * This route handles notification clicks from react-native-track-player
 * and immediately redirects to the home screen
 */

import { Redirect } from 'expo-router';

export default function NotificationClickHandler() {
  // Redirect component is more efficient than useEffect + router.replace
  // It redirects before the component even renders, minimizing the flash
  return <Redirect href="/" />;
}
