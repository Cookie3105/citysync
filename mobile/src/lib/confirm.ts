import { Alert, Platform } from 'react-native';

// Conferma cross-platform. Su nativo usa Alert.alert (con bottoni); sul web usa
// window.confirm, perché i callback dei bottoni di Alert non sono affidabili in
// react-native-web. In questo modo le azioni critiche (terminare un noleggio,
// bloccare un mezzo, eliminare una zona) funzionano ovunque.
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  opts: { confirmLabel?: string; cancelLabel?: string; destructive?: boolean } = {},
) {
  const { confirmLabel = 'Conferma', cancelLabel = 'Annulla', destructive = false } = opts;

  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`);
    if (ok) onConfirm();
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
