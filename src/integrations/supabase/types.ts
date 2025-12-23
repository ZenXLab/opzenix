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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      approval_requests: {
        Row: {
          created_at: string
          current_approvals: number
          description: string | null
          execution_id: string
          id: string
          node_id: string
          requested_by: string | null
          required_approvals: number
          resolved_at: string | null
          status: Database["public"]["Enums"]["approval_status"]
          title: string
        }
        Insert: {
          created_at?: string
          current_approvals?: number
          description?: string | null
          execution_id: string
          id?: string
          node_id: string
          requested_by?: string | null
          required_approvals?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title: string
        }
        Update: {
          created_at?: string
          current_approvals?: number
          description?: string | null
          execution_id?: string
          id?: string
          node_id?: string
          requested_by?: string | null
          required_approvals?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "executions"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_votes: {
        Row: {
          approval_request_id: string
          comment: string | null
          id: string
          user_id: string
          vote: boolean
          voted_at: string
        }
        Insert: {
          approval_request_id: string
          comment?: string | null
          id?: string
          user_id: string
          vote: boolean
          voted_at?: string
        }
        Update: {
          approval_request_id?: string
          comment?: string | null
          id?: string
          user_id?: string
          vote?: boolean
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_votes_approval_request_id_fkey"
            columns: ["approval_request_id"]
            isOneToOne: false
            referencedRelation: "approval_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      checkpoints: {
        Row: {
          created_at: string
          execution_id: string
          id: string
          name: string
          node_id: string
          state: Json
        }
        Insert: {
          created_at?: string
          execution_id: string
          id?: string
          name: string
          node_id: string
          state?: Json
        }
        Update: {
          created_at?: string
          execution_id?: string
          id?: string
          name?: string
          node_id?: string
          state?: Json
        }
        Relationships: [
          {
            foreignKeyName: "checkpoints_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "executions"
            referencedColumns: ["id"]
          },
        ]
      }
      deployments: {
        Row: {
          deployed_at: string
          deployed_by: string | null
          environment: string
          execution_id: string | null
          id: string
          incident_id: string | null
          notes: string | null
          rollback_to: string | null
          status: Database["public"]["Enums"]["execution_status"]
          version: string
        }
        Insert: {
          deployed_at?: string
          deployed_by?: string | null
          environment: string
          execution_id?: string | null
          id?: string
          incident_id?: string | null
          notes?: string | null
          rollback_to?: string | null
          status: Database["public"]["Enums"]["execution_status"]
          version: string
        }
        Update: {
          deployed_at?: string
          deployed_by?: string | null
          environment?: string
          execution_id?: string | null
          id?: string
          incident_id?: string | null
          notes?: string | null
          rollback_to?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployments_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_rollback_to_fkey"
            columns: ["rollback_to"]
            isOneToOne: false
            referencedRelation: "deployments"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_nodes: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          execution_id: string
          id: string
          logs: string[] | null
          metadata: Json | null
          node_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["execution_status"]
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          execution_id: string
          id?: string
          logs?: string[] | null
          metadata?: Json | null
          node_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          execution_id?: string
          id?: string
          logs?: string[] | null
          metadata?: Json | null
          node_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
        }
        Relationships: [
          {
            foreignKeyName: "execution_nodes_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "executions"
            referencedColumns: ["id"]
          },
        ]
      }
      executions: {
        Row: {
          branch: string | null
          commit_hash: string | null
          completed_at: string | null
          environment: string
          flow_template_id: string | null
          id: string
          metadata: Json | null
          name: string
          progress: number | null
          started_at: string
          started_by: string | null
          status: Database["public"]["Enums"]["execution_status"]
        }
        Insert: {
          branch?: string | null
          commit_hash?: string | null
          completed_at?: string | null
          environment?: string
          flow_template_id?: string | null
          id?: string
          metadata?: Json | null
          name: string
          progress?: number | null
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
        }
        Update: {
          branch?: string | null
          commit_hash?: string | null
          completed_at?: string | null
          environment?: string
          flow_template_id?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          progress?: number | null
          started_at?: string
          started_by?: string | null
          status?: Database["public"]["Enums"]["execution_status"]
        }
        Relationships: [
          {
            foreignKeyName: "executions_flow_template_id_fkey"
            columns: ["flow_template_id"]
            isOneToOne: false
            referencedRelation: "flow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      flow_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          edges: Json
          id: string
          name: string
          nodes: Json
          type: Database["public"]["Enums"]["flow_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          edges?: Json
          id?: string
          name: string
          nodes?: Json
          type: Database["public"]["Enums"]["flow_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          edges?: Json
          id?: string
          name?: string
          nodes?: Json
          type?: Database["public"]["Enums"]["flow_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "operator" | "viewer"
      approval_status: "pending" | "approved" | "rejected"
      execution_status:
        | "idle"
        | "running"
        | "success"
        | "warning"
        | "failed"
        | "paused"
      flow_type: "cicd" | "mlops" | "llmops" | "infrastructure" | "security"
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
      app_role: ["admin", "operator", "viewer"],
      approval_status: ["pending", "approved", "rejected"],
      execution_status: [
        "idle",
        "running",
        "success",
        "warning",
        "failed",
        "paused",
      ],
      flow_type: ["cicd", "mlops", "llmops", "infrastructure", "security"],
    },
  },
} as const
