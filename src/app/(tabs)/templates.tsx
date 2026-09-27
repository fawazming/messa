import { useRouter } from 'expo-router';
import { FileText, Plus } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TemplateCard } from '@/components/TemplateCard';
import { Radius, Spacing, palette } from '@/constants/theme';
import { useTemplatesStore } from '@/store/templatesStore';

export default function TemplatesScreen() {
  const router = useRouter();
  const templates = useTemplatesStore((state) => state.templates);
  const remove = useTemplatesStore((state) => state.remove);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Delete template', `Delete “${name}”? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove(id),
      },
    ]);
  };

  return (
    <Screen
      title="Templates"
      subtitle={`${templates.length} saved template${templates.length === 1 ? '' : 's'}`}
      headerLarge
      right={
        <Pressable
          onPress={() => router.push('/template-editor')}
          accessibilityRole="button"
          accessibilityLabel="Create template"
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <Plus size={20} color={palette.white} />
        </Pressable>
      }>
      {templates.length === 0 ? (
        <EmptyState
          icon={<FileText size={26} color={palette.indigo} />}
          title="No templates yet"
          message="Create your first SMS template to personalize messages with dynamic variables."
          actionLabel="Create Template"
          onAction={() => router.push('/template-editor')}
        />
      ) : (
        <View style={styles.list}>
          <Button
            label="Create Template"
            variant="secondary"
            fullWidth
            icon={<Plus size={18} color={palette.text} />}
            onPress={() => router.push('/template-editor')}
          />
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPress={() => router.push(`/template-editor?id=${template.id}`)}
              onEdit={() => router.push(`/template-editor?id=${template.id}`)}
              onDelete={() => confirmDelete(template.id, template.name)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: palette.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
