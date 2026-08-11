import { init, id } from '@instantdb/react';
import schema from '../../instant.schema';

// Helper to extract a valid UUID from string or URL
function getValidAppId(rawId?: string): string {
  if (!rawId) return '4b0a0229-7531-48b4-9518-220b55ae85b1';
  const match = rawId.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  return match ? match[0] : '4b0a0229-7531-48b4-9518-220b55ae85b1';
}

// Public App ID for InstantDB.
// Can be customized via VITE_INSTANT_APP_ID environment variable.
export const INSTANT_APP_ID = getValidAppId((import.meta as any).env?.VITE_INSTANT_APP_ID);

export const db = init({
  appId: INSTANT_APP_ID,
  schema,
});

export { id };
