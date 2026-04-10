export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      event_template_position_slots: {
        Row: {
          created_at: string;
          id: string;
          position_id: string;
          required_count_override: number | null;
          template_id: string;
          training_count: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          position_id: string;
          required_count_override?: number | null;
          template_id: string;
          training_count?: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          position_id?: string;
          required_count_override?: number | null;
          template_id?: string;
          training_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_template_position_slots_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_template_position_slots_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "event_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      event_templates: {
        Row: {
          created_at: string;
          created_by: string | null;
          first_service_at: string;
          id: string;
          is_primary: boolean;
          last_service_end_at: string;
          name: string;
          time_label: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          first_service_at: string;
          id?: string;
          is_primary?: boolean;
          last_service_end_at: string;
          name: string;
          time_label: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          first_service_at?: string;
          id?: string;
          is_primary?: boolean;
          last_service_end_at?: string;
          name?: string;
          time_label?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "event_templates_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      positions: {
        Row: {
          allowed_gender: Database["public"]["Enums"]["position_allowed_gender"];
          created_at: string;
          default_required_count: number;
          id: string;
          name: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          allowed_gender?: Database["public"]["Enums"]["position_allowed_gender"];
          created_at?: string;
          default_required_count?: number;
          id?: string;
          name: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          allowed_gender?: Database["public"]["Enums"]["position_allowed_gender"];
          created_at?: string;
          default_required_count?: number;
          id?: string;
          name?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
        };
        Insert: {
          id?: string;
        };
        Update: {
          id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_event_template: {
        Args: {
          p_created_by?: string | null;
          p_first_service_at: string;
          p_is_primary?: boolean;
          p_last_service_end_at: string;
          p_name: string;
          p_slot_defaults: Json;
        };
        Returns: string;
      };
      reorder_positions: {
        Args: {
          p_position_ids: string[];
        };
        Returns: undefined;
      };
      update_event_template: {
        Args: {
          p_first_service_at: string;
          p_is_primary?: boolean;
          p_last_service_end_at: string;
          p_name: string;
          p_slot_defaults: Json;
          p_template_id: string;
        };
        Returns: string;
      };
    };
    Enums: {
      position_allowed_gender: "all" | "female" | "male";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database["public"];

export type TableRow<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Row"];

export type TableInsert<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Insert"];

export type TableUpdate<TableName extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][TableName]["Update"];

export type DatabaseEnum<EnumName extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][EnumName];
