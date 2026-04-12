export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_at: string
          assignment_kind: Database["public"]["Enums"]["assignment_kind"]
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          event_id: string
          id: string
          position_id: string
          status: Database["public"]["Enums"]["assignment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assignment_kind?: Database["public"]["Enums"]["assignment_kind"]
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          event_id: string
          id?: string
          position_id: string
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assignment_kind?: Database["public"]["Enums"]["assignment_kind"]
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          event_id?: string
          id?: string
          position_id?: string
          status?: Database["public"]["Enums"]["assignment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action_type: string
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
        }
        Insert: {
          action_type: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
        }
        Update: {
          action_type?: string
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      checkins: {
        Row: {
          accuracy_m: number | null
          assignment_id: string
          checked_in_at: string | null
          created_at: string
          exception_approved_at: string | null
          exception_approved_by: string | null
          exception_request_reason: string | null
          exception_requested_at: string | null
          id: string
          lat: number | null
          lng: number | null
          status: Database["public"]["Enums"]["checkin_status"]
          updated_at: string
          user_id: string
          within_radius: boolean | null
        }
        Insert: {
          accuracy_m?: number | null
          assignment_id: string
          checked_in_at?: string | null
          created_at?: string
          exception_approved_at?: string | null
          exception_approved_by?: string | null
          exception_request_reason?: string | null
          exception_requested_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          status: Database["public"]["Enums"]["checkin_status"]
          updated_at?: string
          user_id: string
          within_radius?: boolean | null
        }
        Update: {
          accuracy_m?: number | null
          assignment_id?: string
          checked_in_at?: string | null
          created_at?: string
          exception_approved_at?: string | null
          exception_approved_by?: string | null
          exception_request_reason?: string | null
          exception_requested_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          status?: Database["public"]["Enums"]["checkin_status"]
          updated_at?: string
          user_id?: string
          within_radius?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_exception_approved_by_fkey"
            columns: ["exception_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_position_slots: {
        Row: {
          created_at: string
          event_id: string
          id: string
          position_id: string
          required_count: number
          training_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          position_id: string
          required_count?: number
          training_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          position_id?: string
          required_count?: number
          training_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_position_slots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_position_slots_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      event_template_position_slots: {
        Row: {
          created_at: string
          id: string
          position_id: string
          required_count_override: number | null
          template_id: string
          training_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          position_id: string
          required_count_override?: number | null
          template_id: string
          training_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          position_id?: string
          required_count_override?: number | null
          template_id?: string
          training_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_template_position_slots_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_template_position_slots_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "event_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      event_templates: {
        Row: {
          created_at: string
          created_by: string | null
          first_service_at: string
          id: string
          is_primary: boolean
          last_service_end_at: string
          name: string
          time_label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          first_service_at: string
          id?: string
          is_primary?: boolean
          last_service_end_at: string
          name: string
          time_label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          first_service_at?: string
          id?: string
          is_primary?: boolean
          last_service_end_at?: string
          name?: string
          time_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          event_date: string
          first_service_at: string
          id: string
          last_service_end_at: string
          status: Database["public"]["Enums"]["event_status"]
          template_id: string | null
          time_label: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_date: string
          first_service_at: string
          id?: string
          last_service_end_at: string
          status?: Database["public"]["Enums"]["event_status"]
          template_id?: string | null
          time_label: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_date?: string
          first_service_at?: string
          id?: string
          last_service_end_at?: string
          status?: Database["public"]["Enums"]["event_status"]
          template_id?: string | null
          time_label?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "event_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      member_positions: {
        Row: {
          created_at: string
          id: string
          position_id: string
          status: Database["public"]["Enums"]["member_position_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position_id: string
          status: Database["public"]["Enums"]["member_position_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position_id?: string
          status?: Database["public"]["Enums"]["member_position_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_positions_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_positions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_requests: {
        Row: {
          created_at: string
          id: string
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["membership_request_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["membership_request_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["membership_request_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_overrides: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          overridden_amount: number
          overridden_by: string | null
          override_reason: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          overridden_amount: number
          overridden_by?: string | null
          override_reason: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          overridden_amount?: number
          overridden_by?: string | null
          override_reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_overrides_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_overrides_overridden_by_fkey"
            columns: ["overridden_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          allowed_gender: Database["public"]["Enums"]["position_allowed_gender"]
          created_at: string
          default_required_count: number
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          allowed_gender?: Database["public"]["Enums"]["position_allowed_gender"]
          created_at?: string
          default_required_count?: number
          id?: string
          name: string
          sort_order: number
          updated_at?: string
        }
        Update: {
          allowed_gender?: Database["public"]["Enums"]["position_allowed_gender"]
          created_at?: string
          default_required_count?: number
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          p256dh: string
          revoked_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          p256dh: string
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          p256dh?: string
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      replacement_applications: {
        Row: {
          applied_at: string
          created_at: string
          id: string
          replacement_request_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string
          created_at?: string
          id?: string
          replacement_request_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string
          created_at?: string
          id?: string
          replacement_request_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "replacement_applications_replacement_request_id_fkey"
            columns: ["replacement_request_id"]
            isOneToOne: false
            referencedRelation: "replacement_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacement_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      replacement_requests: {
        Row: {
          approved_assignment_id: string | null
          cancelled_assignment_id: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          position_id: string
          status: Database["public"]["Enums"]["replacement_request_status"]
          updated_at: string
        }
        Insert: {
          approved_assignment_id?: string | null
          cancelled_assignment_id: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          position_id: string
          status?: Database["public"]["Enums"]["replacement_request_status"]
          updated_at?: string
        }
        Update: {
          approved_assignment_id?: string | null
          cancelled_assignment_id?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          position_id?: string
          status?: Database["public"]["Enums"]["replacement_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "replacement_requests_approved_assignment_id_fkey"
            columns: ["approved_assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacement_requests_cancelled_assignment_id_fkey"
            columns: ["cancelled_assignment_id"]
            isOneToOne: true
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacement_requests_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replacement_requests_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          checkin_radius_m: number
          created_at: string
          email: string
          google_sub: string | null
          hourly_wage: number
          id: string
          install_confirmed_at: string | null
          name: string
          onboarding_completed_at: string | null
          phone: string | null
          push_enabled: boolean
          push_subscribed_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          venue_lat: number | null
          venue_lng: number | null
        }
        Insert: {
          checkin_radius_m?: number
          created_at?: string
          email: string
          google_sub?: string | null
          hourly_wage?: number
          id?: string
          install_confirmed_at?: string | null
          name: string
          onboarding_completed_at?: string | null
          phone?: string | null
          push_enabled?: boolean
          push_subscribed_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          venue_lat?: number | null
          venue_lng?: number | null
        }
        Update: {
          checkin_radius_m?: number
          created_at?: string
          email?: string
          google_sub?: string | null
          hourly_wage?: number
          id?: string
          install_confirmed_at?: string | null
          name?: string
          onboarding_completed_at?: string | null
          phone?: string | null
          push_enabled?: boolean
          push_subscribed_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          venue_lat?: number | null
          venue_lng?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_event: {
        Args: {
          p_created_by?: string
          p_event_date: string
          p_template_id: string
          p_title: string
        }
        Returns: string
      }
      create_event_template:
        | {
            Args: {
              p_created_by?: string
              p_first_service_at: string
              p_last_service_end_at: string
              p_name: string
              p_slot_defaults: Json
            }
            Returns: string
          }
        | {
            Args: {
              p_created_by?: string
              p_first_service_at: string
              p_is_primary?: boolean
              p_last_service_end_at: string
              p_name: string
              p_slot_defaults: Json
            }
            Returns: string
          }
      reorder_positions: {
        Args: { p_position_ids: string[] }
        Returns: undefined
      }
      update_event_template:
        | {
            Args: {
              p_first_service_at: string
              p_last_service_end_at: string
              p_name: string
              p_slot_defaults: Json
              p_template_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_first_service_at: string
              p_is_primary?: boolean
              p_last_service_end_at: string
              p_name: string
              p_slot_defaults: Json
              p_template_id: string
            }
            Returns: string
          }
    }
    Enums: {
      app_role: "admin" | "manager" | "member"
      application_status: "applied" | "cancelled"
      assignment_kind: "regular" | "training"
      assignment_status:
        | "assigned"
        | "confirmed"
        | "cancel_requested"
        | "cancelled"
        | "checked_in"
      checkin_status:
        | "checked_in"
        | "exception_requested"
        | "exception_approved"
      event_status:
        | "draft"
        | "recruiting"
        | "staffed"
        | "in_progress"
        | "completed"
        | "cancelled"
      member_position_status: "qualified" | "training"
      membership_request_status: "pending" | "approved" | "rejected"
      position_allowed_gender: "all" | "female" | "male"
      replacement_request_status:
        | "open"
        | "pending_manager_approval"
        | "approved"
        | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "member"],
      application_status: ["applied", "cancelled"],
      assignment_kind: ["regular", "training"],
      assignment_status: [
        "assigned",
        "confirmed",
        "cancel_requested",
        "cancelled",
        "checked_in",
      ],
      checkin_status: [
        "checked_in",
        "exception_requested",
        "exception_approved",
      ],
      event_status: [
        "draft",
        "recruiting",
        "staffed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      member_position_status: ["qualified", "training"],
      membership_request_status: ["pending", "approved", "rejected"],
      position_allowed_gender: ["all", "female", "male"],
      replacement_request_status: [
        "open",
        "pending_manager_approval",
        "approved",
        "closed",
      ],
    },
  },
} as const
