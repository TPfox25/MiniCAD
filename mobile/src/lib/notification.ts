import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export async function registerForPushNotifications() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } =
      await Notifications.requestPermissionsAsync();

    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission was not granted.');
    return null;
  }

  const projectId = '5a441930-e262-4aa1-a7de-ea9a8cb63c0a';

  const tokenResponse =
    await Notifications.getExpoPushTokenAsync({
      projectId,
    });

  const token = tokenResponse.data;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.log('No logged-in user found.');
    return null;
  }

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: user.id,
        token,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    );

  if (error) {
    console.log(
      'Unable to save push token:',
      error.message
    );

    return null;
  }

  console.log('Push token registered successfully.');

  return token;
}