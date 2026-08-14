/**
 * Database types for the curriculum schema.
 *
 * Hand-maintained to match `supabase/migrations/*.sql`. After changing a
 * migration, regenerate this file instead of editing it by hand:
 *
 *   npx supabase gen types typescript --linked > src/lib/supabase/database.types.ts
 *
 * These must be `type` aliases, not `interface`s: postgrest-js constrains the
 * schema to `Record<string, unknown>`, and only type aliases get an implicit
 * index signature. With interfaces the constraint fails silently and every
 * query result degrades to `never`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UnitRow = {
  id: string;
  title: string;
  slug: string;
  kind: string;
  description: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ContentItemRow = {
  id: string;
  unit_id: string;
  primary_label: string;
  secondary_label: string | null;
  illustration_url: string | null;
  audio_url: string | null;
  speech_text: string | null;
  order_index: number;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export type ContentExampleRow = {
  id: string;
  item_id: string;
  label: string;
  image_url: string | null;
  audio_url: string | null;
  speech_text: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type AdminUserRow = {
  user_id: string;
  email: string | null;
  created_at: string;
};

export type UnitInsert = Partial<UnitRow> & Pick<UnitRow, "title" | "slug">;
export type ContentItemInsert = Partial<ContentItemRow> &
  Pick<ContentItemRow, "unit_id" | "primary_label">;
export type ContentExampleInsert = Partial<ContentExampleRow> &
  Pick<ContentExampleRow, "item_id" | "label">;

export type Database = {
  public: {
    Tables: {
      units: {
        Row: UnitRow;
        Insert: UnitInsert;
        Update: Partial<UnitRow>;
        Relationships: [];
      };
      content_items: {
        Row: ContentItemRow;
        Insert: ContentItemInsert;
        Update: Partial<ContentItemRow>;
        Relationships: [
          {
            foreignKeyName: "content_items_unit_id_fkey";
            columns: ["unit_id"];
            isOneToOne: false;
            referencedRelation: "units";
            referencedColumns: ["id"];
          },
        ];
      };
      content_examples: {
        Row: ContentExampleRow;
        Insert: ContentExampleInsert;
        Update: Partial<ContentExampleRow>;
        Relationships: [
          {
            foreignKeyName: "content_examples_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "content_items";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: Partial<AdminUserRow> & Pick<AdminUserRow, "user_id">;
        Update: Partial<AdminUserRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
