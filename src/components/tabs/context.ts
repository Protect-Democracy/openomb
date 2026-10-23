import type { Writable } from 'svelte/store';
import type { createTabs } from '@melt-ui/svelte';

/**
 * A tab registered by a child Tab component.
 */
export type TabItem = {
  id: string;
  label: string;
};

/**
 * Context shared from Tabs to its child Tab components.
 */
export type TabsContext = {
  tabs: Writable<TabItem[]>;
  content: ReturnType<typeof createTabs>['elements']['content'];
};
