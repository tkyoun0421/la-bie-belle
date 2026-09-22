export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  internal: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      active_profile_id: { Args: never; Returns: string };
      check_in: {
        Args: {
          p_day_id: string;
          p_lat: number;
          p_lng: number;
          p_method: string;
          p_now: string;
          p_profile_id: string;
          p_qr_code: string;
          p_reported_at: string;
        };
        Returns: undefined;
      };
      distance_meters: {
        Args: {
          p_lat_a: number;
          p_lat_b: number;
          p_lng_a: number;
          p_lng_b: number;
        };
        Returns: number;
      };
      submit_excuse: {
        Args: {
          p_body: string;
          p_day_id: string;
          p_now: string;
          p_profile_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      assignments: {
        Row: {
          day_id: string;
          ended_at: string | null;
          ended_by: string | null;
          ended_reason: string | null;
          id: string;
          kind: string;
          position: string;
          profile_id: string;
          slot_id: string | null;
          started_at: string;
        };
        Insert: {
          day_id: string;
          ended_at?: string | null;
          ended_by?: string | null;
          ended_reason?: string | null;
          id?: string;
          kind: string;
          position: string;
          profile_id: string;
          slot_id?: string | null;
          started_at?: string;
        };
        Update: {
          day_id?: string;
          ended_at?: string | null;
          ended_by?: string | null;
          ended_reason?: string | null;
          id?: string;
          kind?: string;
          position?: string;
          profile_id?: string;
          slot_id?: string | null;
          started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_day_id_fkey";
            columns: ["day_id"];
            isOneToOne: false;
            referencedRelation: "days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_ended_by_fkey";
            columns: ["ended_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_ended_by_fkey";
            columns: ["ended_by"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "assignments_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "assignments_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "open_slots";
            referencedColumns: ["slot_id"];
          },
          {
            foreignKeyName: "assignments_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "slots";
            referencedColumns: ["id"];
          },
        ];
      };
      availabilities: {
        Row: {
          created_at: string;
          id: string;
          profile_id: string;
          work_date: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          profile_id: string;
          work_date: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          profile_id?: string;
          work_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availabilities_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "availabilities_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      cancel_requests: {
        Row: {
          assignment_id: string;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          decision: string | null;
          decision_reason: string | null;
          id: string;
          profile_id: string;
          reason: string;
        };
        Insert: {
          assignment_id: string;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision?: string | null;
          decision_reason?: string | null;
          id?: string;
          profile_id: string;
          reason: string;
        };
        Update: {
          assignment_id?: string;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision?: string | null;
          decision_reason?: string | null;
          id?: string;
          profile_id?: string;
          reason?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cancel_requests_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cancel_requests_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cancel_requests_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "cancel_requests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cancel_requests_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      check_ins: {
        Row: {
          checked_at: string;
          day_id: string;
          id: string;
          method: string;
          profile_id: string;
          received_at: string;
          reported_at: string;
        };
        Insert: {
          checked_at: string;
          day_id: string;
          id?: string;
          method: string;
          profile_id: string;
          received_at: string;
          reported_at: string;
        };
        Update: {
          checked_at?: string;
          day_id?: string;
          id?: string;
          method?: string;
          profile_id?: string;
          received_at?: string;
          reported_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "check_ins_day_id_fkey";
            columns: ["day_id"];
            isOneToOne: false;
            referencedRelation: "days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_ins_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "check_ins_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      days: {
        Row: {
          ceremony_at: string | null;
          ends_at: string;
          id: string;
          opened_at: string;
          opened_by: string;
          schedule_id: string;
          starts_at: string;
          work_date: string;
        };
        Insert: {
          ceremony_at?: string | null;
          ends_at: string;
          id?: string;
          opened_at?: string;
          opened_by: string;
          schedule_id: string;
          starts_at: string;
          work_date: string;
        };
        Update: {
          ceremony_at?: string | null;
          ends_at?: string;
          id?: string;
          opened_at?: string;
          opened_by?: string;
          schedule_id?: string;
          starts_at?: string;
          work_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: "days_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "days_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "days_schedule_id_fkey";
            columns: ["schedule_id"];
            isOneToOne: false;
            referencedRelation: "schedules";
            referencedColumns: ["id"];
          },
        ];
      };
      excuses: {
        Row: {
          body: string;
          day_id: string;
          decided_at: string | null;
          decided_by: string | null;
          decision: string | null;
          decision_reason: string | null;
          id: string;
          profile_id: string;
          submitted_at: string;
        };
        Insert: {
          body: string;
          day_id: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision?: string | null;
          decision_reason?: string | null;
          id?: string;
          profile_id: string;
          submitted_at?: string;
        };
        Update: {
          body?: string;
          day_id?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision?: string | null;
          decision_reason?: string | null;
          id?: string;
          profile_id?: string;
          submitted_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "excuses_day_id_fkey";
            columns: ["day_id"];
            isOneToOne: false;
            referencedRelation: "days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "excuses_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "excuses_decided_by_fkey";
            columns: ["decided_by"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "excuses_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "excuses_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      hall_secrets: {
        Row: {
          hall_id: string;
          qr_code: string;
          rotated_at: string;
        };
        Insert: {
          hall_id: string;
          qr_code: string;
          rotated_at?: string;
        };
        Update: {
          hall_id?: string;
          qr_code?: string;
          rotated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "hall_secrets_hall_id_fkey";
            columns: ["hall_id"];
            isOneToOne: true;
            referencedRelation: "halls";
            referencedColumns: ["id"];
          },
        ];
      };
      halls: {
        Row: {
          default_ends: string;
          default_slots: Json;
          default_starts: string;
          id: string;
          lat: number;
          lng: number;
          radius_m: number;
        };
        Insert: {
          default_ends: string;
          default_slots: Json;
          default_starts: string;
          id?: string;
          lat: number;
          lng: number;
          radius_m: number;
        };
        Update: {
          default_ends?: string;
          default_slots?: Json;
          default_starts?: string;
          id?: string;
          lat?: number;
          lng?: number;
          radius_m?: number;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          claimed_at: string | null;
          created_at: string;
          id: string;
          kind: string;
          payload: Json;
          profile_id: string;
          push_attempts: number;
          pushed_at: string | null;
          read_at: string | null;
          subject_id: string | null;
        };
        Insert: {
          claimed_at?: string | null;
          created_at?: string;
          id?: string;
          kind: string;
          payload?: Json;
          profile_id: string;
          push_attempts?: number;
          pushed_at?: string | null;
          read_at?: string | null;
          subject_id?: string | null;
        };
        Update: {
          claimed_at?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          payload?: Json;
          profile_id?: string;
          push_attempts?: number;
          pushed_at?: string | null;
          read_at?: string | null;
          subject_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      position_grants: {
        Row: {
          granted_at: string;
          granted_by: string;
          id: string;
          position: string;
          profile_id: string;
        };
        Insert: {
          granted_at?: string;
          granted_by: string;
          id?: string;
          position: string;
          profile_id: string;
        };
        Update: {
          granted_at?: string;
          granted_by?: string;
          id?: string;
          position?: string;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "position_grants_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "position_grants_granted_by_fkey";
            columns: ["granted_by"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "position_grants_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "position_grants_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      profile_private: {
        Row: {
          birth_date: string | null;
          gender: string | null;
          phone: string | null;
          profile_id: string;
        };
        Insert: {
          birth_date?: string | null;
          gender?: string | null;
          phone?: string | null;
          profile_id: string;
        };
        Update: {
          birth_date?: string | null;
          gender?: string | null;
          phone?: string | null;
          profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profile_private_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profile_private_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: true;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      profiles: {
        Row: {
          approved_at: string | null;
          blocked_at: string | null;
          created_at: string;
          display_name: string | null;
          erased_at: string | null;
          id: string;
          left_at: string | null;
          notifications_enabled: boolean;
          photo_url: string | null;
          rejected_at: string | null;
          role: string;
          submitted_at: string | null;
          user_id: string | null;
        };
        Insert: {
          approved_at?: string | null;
          blocked_at?: string | null;
          created_at?: string;
          display_name?: string | null;
          erased_at?: string | null;
          id?: string;
          left_at?: string | null;
          notifications_enabled?: boolean;
          photo_url?: string | null;
          rejected_at?: string | null;
          role?: string;
          submitted_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          approved_at?: string | null;
          blocked_at?: string | null;
          created_at?: string;
          display_name?: string | null;
          erased_at?: string | null;
          id?: string;
          left_at?: string | null;
          notifications_enabled?: boolean;
          photo_url?: string | null;
          rejected_at?: string | null;
          role?: string;
          submitted_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      push_tokens: {
        Row: {
          created_at: string;
          id: string;
          profile_id: string;
          token: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          profile_id: string;
          token: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          profile_id?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "push_tokens_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "push_tokens_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      request_candidates: {
        Row: {
          expires_at: string;
          id: string;
          profile_id: string;
          request_id: string;
          responded_at: string | null;
          status: string;
        };
        Insert: {
          expires_at: string;
          id?: string;
          profile_id: string;
          request_id: string;
          responded_at?: string | null;
          status: string;
        };
        Update: {
          expires_at?: string;
          id?: string;
          profile_id?: string;
          request_id?: string;
          responded_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "request_candidates_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "request_candidates_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "request_candidates_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "requests";
            referencedColumns: ["id"];
          },
        ];
      };
      requests: {
        Row: {
          approved_candidate_id: string | null;
          assignment_id: string | null;
          closed_at: string | null;
          created_at: string;
          expires_at: string;
          id: string;
          kind: string;
          requested_by: string;
          slot_id: string | null;
        };
        Insert: {
          approved_candidate_id?: string | null;
          assignment_id?: string | null;
          closed_at?: string | null;
          created_at?: string;
          expires_at: string;
          id?: string;
          kind: string;
          requested_by: string;
          slot_id?: string | null;
        };
        Update: {
          approved_candidate_id?: string | null;
          assignment_id?: string | null;
          closed_at?: string | null;
          created_at?: string;
          expires_at?: string;
          id?: string;
          kind?: string;
          requested_by?: string;
          slot_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "requests_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requests_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
          {
            foreignKeyName: "requests_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "open_slots";
            referencedColumns: ["slot_id"];
          },
          {
            foreignKeyName: "requests_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "slots";
            referencedColumns: ["id"];
          },
        ];
      };
      schedules: {
        Row: {
          application_deadline: string | null;
          confirmed_at: string | null;
          created_at: string;
          created_by: string;
          id: string;
          month: string;
        };
        Insert: {
          application_deadline?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          created_by: string;
          id?: string;
          month: string;
        };
        Update: {
          application_deadline?: string | null;
          confirmed_at?: string | null;
          created_at?: string;
          created_by?: string;
          id?: string;
          month?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schedules_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "schedules_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      slots: {
        Row: {
          created_at: string;
          day_id: string;
          ended_at: string | null;
          ended_by: string | null;
          id: string;
          positions: string[];
        };
        Insert: {
          created_at?: string;
          day_id: string;
          ended_at?: string | null;
          ended_by?: string | null;
          id?: string;
          positions: string[];
        };
        Update: {
          created_at?: string;
          day_id?: string;
          ended_at?: string | null;
          ended_by?: string | null;
          id?: string;
          positions?: string[];
        };
        Relationships: [
          {
            foreignKeyName: "slots_day_id_fkey";
            columns: ["day_id"];
            isOneToOne: false;
            referencedRelation: "days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slots_ended_by_fkey";
            columns: ["ended_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "slots_ended_by_fkey";
            columns: ["ended_by"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
    };
    Views: {
      excuse_status: {
        Row: {
          day_id: string | null;
          decided_at: string | null;
          decision: string | null;
          profile_id: string | null;
          submitted_at: string | null;
        };
        Insert: {
          day_id?: string | null;
          decided_at?: string | null;
          decision?: string | null;
          profile_id?: string | null;
          submitted_at?: string | null;
        };
        Update: {
          day_id?: string | null;
          decided_at?: string | null;
          decision?: string | null;
          profile_id?: string | null;
          submitted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "excuses_day_id_fkey";
            columns: ["day_id"];
            isOneToOne: false;
            referencedRelation: "days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "excuses_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "excuses_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "push_reachable";
            referencedColumns: ["profile_id"];
          },
        ];
      };
      open_slots: {
        Row: {
          day_id: string | null;
          positions: string[] | null;
          slot_id: string | null;
          work_date: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "slots_day_id_fkey";
            columns: ["day_id"];
            isOneToOne: false;
            referencedRelation: "days";
            referencedColumns: ["id"];
          },
        ];
      };
      push_reachable: {
        Row: {
          has_device: boolean | null;
          profile_id: string | null;
        };
        Insert: {
          has_device?: never;
          profile_id?: string | null;
        };
        Update: {
          has_device?: never;
          profile_id?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      approve_member: { Args: { profile_id: string }; Returns: undefined };
      check_in: {
        Args: {
          p_day_id: string;
          p_lat?: number;
          p_lng?: number;
          p_method: string;
          p_qr_code?: string;
          p_reported_at: string;
        };
        Returns: undefined;
      };
      close_day: { Args: { p_work_date: string }; Returns: undefined };
      confirm_schedule: { Args: { p_month: string }; Returns: undefined };
      create_schedule: {
        Args: { p_deadline: string; p_month: string };
        Returns: undefined;
      };
      decide_excuse: {
        Args: { p_approved: boolean; p_excuse_id: string; p_reason?: string };
        Returns: undefined;
      };
      ensure_profile: { Args: never; Returns: undefined };
      is_admin: { Args: never; Returns: boolean };
      is_approved: { Args: never; Returns: boolean };
      mark_notifications_read: {
        Args: { p_ids: string[] };
        Returns: undefined;
      };
      open_day: { Args: { p_work_date: string }; Returns: undefined };
      reject_member: { Args: { profile_id: string }; Returns: undefined };
      remove_push_token: { Args: { p_token: string }; Returns: undefined };
      rotate_qr: { Args: never; Returns: undefined };
      save_push_token: { Args: { p_token: string }; Returns: undefined };
      set_application_deadline: {
        Args: { p_deadline: string; p_month: string };
        Returns: undefined;
      };
      set_day_hours: {
        Args: {
          p_ceremony?: string;
          p_ends: string;
          p_starts: string;
          p_work_date: string;
        };
        Returns: undefined;
      };
      set_hall_defaults: {
        Args: { p_ends: string; p_slots: Json; p_starts: string };
        Returns: undefined;
      };
      set_hall_location: {
        Args: { p_lat: number; p_lng: number; p_radius_m: number };
        Returns: undefined;
      };
      set_notifications_enabled: {
        Args: { p_on: boolean };
        Returns: undefined;
      };
      submit_excuse: {
        Args: { p_body: string; p_day_id: string };
        Returns: undefined;
      };
      submit_profile: {
        Args: {
          birth_date: string;
          display_name: string;
          gender: string;
          phone: string;
        };
        Returns: undefined;
      };
      update_my_photo: { Args: { photo_url: string }; Returns: undefined };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  internal: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
