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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      lead_events: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          title: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          title: string
          type: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address: string | null
          category: string | null
          city: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          deal_value: number | null
          description: string | null
          email: string | null
          facebook: string | null
          first_contact_at: string | null
          google_maps_url: string | null
          id: string
          instagram: string | null
          last_contact_at: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          postal_code: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          rating: number | null
          reviews_count: number | null
          score: number
          site_status: Database["public"]["Enums"]["site_status"]
          source: string
          stage: Database["public"]["Enums"]["lead_stage"]
          state: string | null
          tags: string[]
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          category?: string | null
          city?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          first_contact_at?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          last_contact_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          postal_code?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          rating?: number | null
          reviews_count?: number | null
          score?: number
          site_status?: Database["public"]["Enums"]["site_status"]
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          state?: string | null
          tags?: string[]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          category?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          first_contact_at?: string | null
          google_maps_url?: string | null
          id?: string
          instagram?: string | null
          last_contact_at?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          postal_code?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          rating?: number | null
          reviews_count?: number | null
          score?: number
          site_status?: Database["public"]["Enums"]["site_status"]
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          state?: string | null
          tags?: string[]
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          owner_id?: string
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
          job_title: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
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
          role: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "gerente" | "vendedor" | "funcionario"
      lead_priority: "baixa" | "media" | "alta"
      lead_stage:
        | "novo_lead"
        | "analisado"
        | "sem_site"
        | "possui_site"
        | "mensagem_enviada"
        | "respondeu"
        | "negociacao"
        | "proposta_enviada"
        | "reuniao"
        | "aguardando"
        | "cliente"
        | "perdido"
      lead_temperature: "frio" | "morno" | "quente"
      site_status:
        | "sem_site"
        | "possui_site"
        | "site_ruim"
        | "site_desatualizado"
        | "site_lento"
        | "site_moderno"
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
      app_role: ["admin", "gerente", "vendedor", "funcionario"],
      lead_priority: ["baixa", "media", "alta"],
      lead_stage: [
        "novo_lead",
        "analisado",
        "sem_site",
        "possui_site",
        "mensagem_enviada",
        "respondeu",
        "negociacao",
        "proposta_enviada",
        "reuniao",
        "aguardando",
        "cliente",
        "perdido",
      ],
      lead_temperature: ["frio", "morno", "quente"],
      site_status: [
        "sem_site",
        "possui_site",
        "site_ruim",
        "site_desatualizado",
        "site_lento",
        "site_moderno",
      ],
    },
  },
} as const
