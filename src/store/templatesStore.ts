import { create } from 'zustand';

import {
  createTemplate,
  loadTemplates,
  removeTemplate,
  seedTemplates,
  updateTemplate,
} from '@/services/templateService';
import type { MessaTemplate } from '@/types';

type TemplatesState = {
  templates: MessaTemplate[];
  loading: boolean;
  load: () => Promise<void>;
  create: (name: string, body: string) => Promise<MessaTemplate>;
  update: (template: MessaTemplate) => Promise<void>;
  remove: (id: string) => Promise<void>;
  getById: (id: string) => MessaTemplate | undefined;
};

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
  templates: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    await seedTemplates();
    const templates = await loadTemplates();
    set({ templates, loading: false });
  },

  create: async (name, body) => {
    const template = await createTemplate(name, body);
    set({ templates: [template, ...get().templates] });
    return template;
  },

  update: async (template) => {
    const updated = await updateTemplate(template);
    set({
      templates: get().templates.map((item) => (item.id === updated.id ? updated : item)),
    });
  },

  remove: async (id) => {
    await removeTemplate(id);
    set({ templates: get().templates.filter((item) => item.id !== id) });
  },

  getById: (id) => get().templates.find((template) => template.id === id),
}));
