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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string | null
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          content: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          kind: string
          metadata: Json | null
          owner_id: string
        }
        Insert: {
          content: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          kind?: string
          metadata?: Json | null
          owner_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          kind?: string
          metadata?: Json | null
          owner_id?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          lead_id: string | null
          location: string | null
          owner_id: string
          remind_minutes_before: number | null
          starts_at: string
          status: Database["public"]["Enums"]["appointment_status"]
          title: string
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          owner_id: string
          remind_minutes_before?: number | null
          starts_at: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title: string
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          lead_id?: string | null
          location?: string | null
          owner_id?: string
          remind_minutes_before?: number | null
          starts_at?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title?: string
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          owner_id: string
          size_bytes: number | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          owner_id: string
          size_bytes?: number | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          owner_id?: string
          size_bytes?: number | null
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          automation_id: string
          created_at: string
          detail: string | null
          id: string
          lead_id: string | null
          owner_id: string
          status: string
        }
        Insert: {
          automation_id: string
          created_at?: string
          detail?: string | null
          id?: string
          lead_id?: string | null
          owner_id: string
          status?: string
        }
        Update: {
          automation_id?: string
          created_at?: string
          detail?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          description: string | null
          id: string
          last_run_at: string | null
          name: string
          owner_id: string
          run_count: number
          status: Database["public"]["Enums"]["automation_status"]
          trigger_config: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name: string
          owner_id: string
          run_count?: number
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          last_run_at?: string | null
          name?: string
          owner_id?: string
          run_count?: number
          status?: Database["public"]["Enums"]["automation_status"]
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          industry: string | null
          legal_name: string | null
          name: string
          notes: string | null
          owner_id: string
          phone: string | null
          postal_code: string | null
          size: string | null
          state: string | null
          tags: string[]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          name: string
          notes?: string | null
          owner_id: string
          phone?: string | null
          postal_code?: string | null
          size?: string | null
          state?: string | null
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          name?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          postal_code?: string | null
          size?: string | null
          state?: string | null
          tags?: string[]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          birthday: string | null
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          instagram: string | null
          is_decision_maker: boolean
          is_partner: boolean
          lead_id: string | null
          linkedin: string | null
          notes: string | null
          owner_id: string
          phone: string | null
          role_title: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          birthday?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          instagram?: string | null
          is_decision_maker?: boolean
          is_partner?: boolean
          lead_id?: string | null
          linkedin?: string | null
          notes?: string | null
          owner_id: string
          phone?: string | null
          role_title?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          birthday?: string | null
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          instagram?: string | null
          is_decision_maker?: boolean
          is_partner?: boolean
          lead_id?: string | null
          linkedin?: string | null
          notes?: string | null
          owner_id?: string
          phone?: string | null
          role_title?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          field_id: string
          id: string
          owner_id: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          field_id: string
          id?: string
          owner_id: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          field_id?: string
          id?: string
          owner_id?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string
          created_by: string
          entity_type: string
          field_type: string
          id: string
          key: string
          label: string
          options: Json
          position: number
          required: boolean
        }
        Insert: {
          created_at?: string
          created_by: string
          entity_type?: string
          field_type?: string
          id?: string
          key: string
          label: string
          options?: Json
          position?: number
          required?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string
          entity_type?: string
          field_type?: string
          id?: string
          key?: string
          label?: string
          options?: Json
          position?: number
          required?: boolean
        }
        Relationships: []
      }
      deals: {
        Row: {
          amount: number
          closed_at: string | null
          created_at: string
          id: string
          lead_id: string | null
          notes: string | null
          owner_id: string
          status: Database["public"]["Enums"]["deal_status"]
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          closed_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id: string
          status?: Database["public"]["Enums"]["deal_status"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id?: string
          status?: Database["public"]["Enums"]["deal_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_entries: {
        Row: {
          amount: number
          category: string | null
          commission_rate: number
          cost_center: string | null
          created_at: string
          deal_id: string | null
          description: string
          due_date: string | null
          id: string
          installment_number: number
          installment_total: number
          kind: Database["public"]["Enums"]["finance_kind"]
          lead_id: string | null
          notes: string | null
          owner_id: string
          paid_at: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["finance_status"]
          updated_at: string
        }
        Insert: {
          amount?: number
          category?: string | null
          commission_rate?: number
          cost_center?: string | null
          created_at?: string
          deal_id?: string | null
          description: string
          due_date?: string | null
          id?: string
          installment_number?: number
          installment_total?: number
          kind?: Database["public"]["Enums"]["finance_kind"]
          lead_id?: string | null
          notes?: string | null
          owner_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["finance_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          commission_rate?: number
          cost_center?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string
          due_date?: string | null
          id?: string
          installment_number?: number
          installment_total?: number
          kind?: Database["public"]["Enums"]["finance_kind"]
          lead_id?: string | null
          notes?: string | null
          owner_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["finance_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_entries_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_entries_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          id: string
          metric: Database["public"]["Enums"]["goal_metric"]
          owner_id: string
          period_end: string
          period_start: string
          target: number
          team_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metric?: Database["public"]["Enums"]["goal_metric"]
          owner_id: string
          period_end: string
          period_start: string
          target?: number
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metric?: Database["public"]["Enums"]["goal_metric"]
          owner_id?: string
          period_end?: string
          period_start?: string
          target?: number
          team_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
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
          ai_summary: string | null
          campaign: string | null
          category: string | null
          city: string | null
          company_id: string | null
          company_name: string
          contact_name: string | null
          created_at: string
          deal_value: number | null
          description: string | null
          email: string | null
          facebook: string | null
          first_contact_at: string | null
          google_maps_url: string | null
          health_score: number
          id: string
          instagram: string | null
          interests: string[]
          last_contact_at: string | null
          last_interaction_at: string | null
          latitude: number | null
          longitude: number | null
          next_action: string | null
          next_action_at: string | null
          notes: string | null
          opening_hours: Json | null
          owner_id: string
          phone: string | null
          pipeline_id: string | null
          postal_code: string | null
          potential_value: number | null
          primary_contact_id: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          rating: number | null
          reviews_count: number | null
          score: number
          site_status: Database["public"]["Enums"]["site_status"]
          source: string
          stage: Database["public"]["Enums"]["lead_stage"]
          state: string | null
          tags: string[]
          team_id: string | null
          temperature: Database["public"]["Enums"]["lead_temperature"]
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          website: string | null
          whatsapp: string | null
          win_probability: number
        }
        Insert: {
          address?: string | null
          ai_summary?: string | null
          campaign?: string | null
          category?: string | null
          city?: string | null
          company_id?: string | null
          company_name: string
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          first_contact_at?: string | null
          google_maps_url?: string | null
          health_score?: number
          id?: string
          instagram?: string | null
          interests?: string[]
          last_contact_at?: string | null
          last_interaction_at?: string | null
          latitude?: number | null
          longitude?: number | null
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          opening_hours?: Json | null
          owner_id: string
          phone?: string | null
          pipeline_id?: string | null
          postal_code?: string | null
          potential_value?: number | null
          primary_contact_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          rating?: number | null
          reviews_count?: number | null
          score?: number
          site_status?: Database["public"]["Enums"]["site_status"]
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          state?: string | null
          tags?: string[]
          team_id?: string | null
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website?: string | null
          whatsapp?: string | null
          win_probability?: number
        }
        Update: {
          address?: string | null
          ai_summary?: string | null
          campaign?: string | null
          category?: string | null
          city?: string | null
          company_id?: string | null
          company_name?: string
          contact_name?: string | null
          created_at?: string
          deal_value?: number | null
          description?: string | null
          email?: string | null
          facebook?: string | null
          first_contact_at?: string | null
          google_maps_url?: string | null
          health_score?: number
          id?: string
          instagram?: string | null
          interests?: string[]
          last_contact_at?: string | null
          last_interaction_at?: string | null
          latitude?: number | null
          longitude?: number | null
          next_action?: string | null
          next_action_at?: string | null
          notes?: string | null
          opening_hours?: Json | null
          owner_id?: string
          phone?: string | null
          pipeline_id?: string | null
          postal_code?: string | null
          potential_value?: number | null
          primary_contact_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          rating?: number | null
          reviews_count?: number | null
          score?: number
          site_status?: Database["public"]["Enums"]["site_status"]
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          state?: string | null
          tags?: string[]
          team_id?: string | null
          temperature?: Database["public"]["Enums"]["lead_temperature"]
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          website?: string | null
          whatsapp?: string | null
          win_probability?: number
        }
        Relationships: [
          {
            foreignKeyName: "leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          id: string
          is_lost: boolean
          is_won: boolean
          name: string
          pipeline_id: string
          position: number
          probability: number
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name: string
          pipeline_id: string
          position?: number
          probability?: number
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_lost?: boolean
          is_won?: boolean
          name?: string
          pipeline_id?: string
          position?: number
          probability?: number
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          position?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          position?: number
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
      proposals: {
        Row: {
          created_at: string
          discount: number
          id: string
          items: Json
          lead_id: string | null
          notes: string | null
          number: string
          owner_id: string
          status: Database["public"]["Enums"]["proposal_status"]
          title: string
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          discount?: number
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          number: string
          owner_id: string
          status?: Database["public"]["Enums"]["proposal_status"]
          title: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          discount?: number
          id?: string
          items?: Json
          lead_id?: string | null
          notes?: string | null
          number?: string
          owner_id?: string
          status?: Database["public"]["Enums"]["proposal_status"]
          title?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          created_by: string
          entity_type: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          entity_type?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          entity_type?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          company_id: string | null
          completed_at: string | null
          created_at: string
          created_by_ai: boolean
          deal_id: string | null
          description: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          owner_id: string
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_ai?: boolean
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by_ai?: boolean
          deal_id?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          owner_id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          is_leader: boolean
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_leader?: boolean
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_leader?: boolean
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
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
      whatsapp_conversations: {
        Row: {
          contact_name: string | null
          contact_phone: string
          created_at: string
          id: string
          labels: string[]
          last_message: string | null
          last_message_at: string | null
          lead_id: string | null
          number_id: string | null
          owner_id: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          id?: string
          labels?: string[]
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          number_id?: string | null
          owner_id: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          id?: string
          labels?: string[]
          last_message?: string | null
          last_message_at?: string | null
          lead_id?: string | null
          number_id?: string | null
          owner_id?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_number_id_fkey"
            columns: ["number_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_numbers"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          conversation_id: string
          created_at: string
          direction: Database["public"]["Enums"]["wa_direction"]
          id: string
          media_type: string | null
          media_url: string | null
          owner_id: string
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["wa_message_status"]
        }
        Insert: {
          body?: string | null
          conversation_id: string
          created_at?: string
          direction?: Database["public"]["Enums"]["wa_direction"]
          id?: string
          media_type?: string | null
          media_url?: string | null
          owner_id: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["wa_message_status"]
        }
        Update: {
          body?: string | null
          conversation_id?: string
          created_at?: string
          direction?: Database["public"]["Enums"]["wa_direction"]
          id?: string
          media_type?: string | null
          media_url?: string | null
          owner_id?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["wa_message_status"]
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_numbers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string
          owner_id: string
          phone: string
          provider: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          owner_id: string
          phone: string
          provider?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          owner_id?: string
          phone?: string
          provider?: string
          updated_at?: string
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
      appointment_status: "agendado" | "concluido" | "cancelado"
      appointment_type: "reuniao" | "visita" | "ligacao" | "follow_up" | "outro"
      automation_status: "ativa" | "pausada" | "rascunho"
      deal_status: "aberta" | "ganha" | "perdida"
      finance_kind: "receita" | "despesa"
      finance_status: "previsto" | "pago" | "atrasado" | "cancelado"
      goal_metric: "receita" | "leads" | "negocios" | "reunioes" | "propostas"
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
      proposal_status: "rascunho" | "enviada" | "aceita" | "recusada"
      site_status:
        | "sem_site"
        | "possui_site"
        | "site_ruim"
        | "site_desatualizado"
        | "site_lento"
        | "site_moderno"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
      wa_direction: "entrada" | "saida"
      wa_message_status: "pendente" | "enviada" | "entregue" | "lida" | "erro"
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
      appointment_status: ["agendado", "concluido", "cancelado"],
      appointment_type: ["reuniao", "visita", "ligacao", "follow_up", "outro"],
      automation_status: ["ativa", "pausada", "rascunho"],
      deal_status: ["aberta", "ganha", "perdida"],
      finance_kind: ["receita", "despesa"],
      finance_status: ["previsto", "pago", "atrasado", "cancelado"],
      goal_metric: ["receita", "leads", "negocios", "reunioes", "propostas"],
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
      proposal_status: ["rascunho", "enviada", "aceita", "recusada"],
      site_status: [
        "sem_site",
        "possui_site",
        "site_ruim",
        "site_desatualizado",
        "site_lento",
        "site_moderno",
      ],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
      wa_direction: ["entrada", "saida"],
      wa_message_status: ["pendente", "enviada", "entregue", "lida", "erro"],
    },
  },
} as const
