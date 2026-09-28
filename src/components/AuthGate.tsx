import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { MessaMark } from '@/components/Logo';
import { TextField } from '@/components/TextField';
import {
  REGISTRATION_CURRENCY,
  REGISTRATION_FEE,
  VENDOR,
  WHATSAPP_DISPLAY,
  whatsappTokenLink,
} from '@/constants/config';
import { FontSize, Radius, Spacing, palette } from '@/constants/theme';
import { useAuthStore } from '@/store/authStore';

type Mode = 'login' | 'register';

export function AuthGate() {
  const insets = useSafeAreaInsets();
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const apiBaseUrl = useAuthStore((state) => state.apiBaseUrl);
  const setBaseUrl = useAuthStore((state) => state.setBaseUrl);
  const clearError = useAuthStore((state) => state.clearError);

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [showServer, setShowServer] = useState(false);
  const [serverUrl, setServerUrl] = useState(apiBaseUrl);

  const submit = async () => {
    if (mode === 'login') {
      await login(email.trim(), password);
    } else {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        token: token.trim(),
        phone: phone.trim() || undefined,
      });
    }
  };

  const switchMode = (next: Mode) => {
    clearError();
    setMode(next);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.five },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <MessaMark size={62} />
          <Text style={styles.brand}>MESSA</Text>
          <Text style={styles.tagline}>Turn Data Into Messages.</Text>
        </View>

        <View style={styles.segment}>
          <Pressable
            onPress={() => switchMode('login')}
            style={[styles.segmentItem, mode === 'login' && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === 'login' && styles.segmentTextActive]}>
              Sign in
            </Text>
          </Pressable>
          <Pressable
            onPress={() => switchMode('register')}
            style={[styles.segmentItem, mode === 'register' && styles.segmentActive]}>
            <Text style={[styles.segmentText, mode === 'register' && styles.segmentTextActive]}>
              Create account
            </Text>
          </Pressable>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mode === 'register' ? (
          <>
            <TextField label="Full name" value={name} onChangeText={setName} placeholder="Aisha Yusuf" />
            <TextField
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="080…"
            />
          </>
        ) : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        {mode === 'register' ? (
          <TextField
            label="Registration token"
            value={token}
            onChangeText={setToken}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="MESSA-XXXX-XXXX"
          />
        ) : null}

        <Button
          label={mode === 'login' ? 'Sign in' : 'Create account'}
          onPress={submit}
          loading={loading}
          fullWidth
        />

        {mode === 'register' ? (
          <View style={styles.tokenCard}>
            <Text style={styles.tokenTitle}>Need a registration token?</Text>
            <Text style={styles.tokenText}>
              Pay {REGISTRATION_CURRENCY} {REGISTRATION_FEE.toLocaleString()} to {VENDOR} on WhatsApp{' '}
              {WHATSAPP_DISPLAY}, then enter the token you receive.
            </Text>
            <Button
              label={`Message ${VENDOR} on WhatsApp`}
              variant="secondary"
              onPress={() => Linking.openURL(whatsappTokenLink())}
            />
          </View>
        ) : null}

        <Pressable onPress={() => setShowServer((value) => !value)} style={styles.serverToggle}>
          <Text style={styles.serverToggleText}>
            {showServer ? 'Hide server settings' : 'Server settings'}
          </Text>
        </Pressable>

        {showServer ? (
          <View style={styles.serverBox}>
            <TextField
              label="API base URL"
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="https://messa.sgm.ng/api"
            />
            <Button label="Save server URL" variant="secondary" size="sm" onPress={() => setBaseUrl(serverUrl)} />
          </View>
        ) : null}

        <Text style={styles.footer}>MESSA — Data-to-SMS</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.background },
  scroll: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  brand: {
    fontSize: FontSize.display,
    fontWeight: '800',
    letterSpacing: 4,
    color: palette.text,
  },
  tagline: {
    fontSize: FontSize.body,
    color: palette.textSecondary,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: palette.border,
    borderRadius: Radius.lg,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: palette.surface,
  },
  segmentText: {
    fontSize: FontSize.body,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  segmentTextActive: {
    color: palette.text,
  },
  error: {
    color: palette.error,
    fontSize: FontSize.small,
    backgroundColor: palette.errorSoft,
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
  tokenCard: {
    backgroundColor: palette.indigoSoft,
    borderRadius: Radius.card,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  tokenTitle: {
    fontSize: FontSize.body,
    fontWeight: '700',
    color: palette.indigoDark,
  },
  tokenText: {
    fontSize: FontSize.small,
    color: palette.indigoDark,
    lineHeight: 20,
  },
  serverToggle: {
    alignSelf: 'center',
    paddingVertical: Spacing.two,
  },
  serverToggleText: {
    color: palette.textSecondary,
    fontSize: FontSize.small,
    fontWeight: '600',
  },
  serverBox: {
    gap: Spacing.two,
  },
  footer: {
    textAlign: 'center',
    color: palette.textSecondary,
    fontSize: FontSize.caption,
    marginTop: Spacing.two,
  },
});
