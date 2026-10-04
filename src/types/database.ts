// AUTO-GENERATED from the Supabase schema. Do not edit by hand.
// Regenerate: npx supabase gen types typescript --project-id mfnhhfaryfvypozfbqiw --schema public

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_contacts: {
        Row: {
          client_id: string
          created_at: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          phone: string | null
          role: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          phone?: string | null
          role?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contacts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          alt_phone: string | null
          assigned_manager: string | null
          code: string | null
          company_name: string
          contact_person: string | null
          created_at: string
          created_by: string | null
          email: string | null
          gstin: string | null
          id: string
          industry: string | null
          is_demo: boolean
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          alt_phone?: string | null
          assigned_manager?: string | null
          code?: string | null
          company_name: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          industry?: string | null
          is_demo?: boolean
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          alt_phone?: string | null
          assigned_manager?: string | null
          code?: string | null
          company_name?: string
          contact_person?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          industry?: string | null
          is_demo?: boolean
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_manager_fkey"
            columns: ["assigned_manager"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          company_name: string
          created_at: string
          currency: string
          fy_start_month: number
          gstin: string | null
          id: boolean
          logo_url: string | null
          onboarded: boolean
          require_expense_proof: boolean
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string
          created_at?: string
          currency?: string
          fy_start_month?: number
          gstin?: string | null
          id?: boolean
          logo_url?: string | null
          onboarded?: boolean
          require_expense_proof?: boolean
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string
          created_at?: string
          currency?: string
          fy_start_month?: number
          gstin?: string | null
          id?: boolean
          logo_url?: string | null
          onboarded?: boolean
          require_expense_proof?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          bucket: string
          client_id: string | null
          created_at: string
          doc_type: Database["public"]["Enums"]["document_type"]
          id: string
          mime_type: string | null
          name: string
          project_id: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          bucket?: string
          client_id?: string | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          mime_type?: string | null
          name: string
          project_id?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          bucket?: string
          client_id?: string | null
          created_at?: string
          doc_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          mime_type?: string | null
          name?: string
          project_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_approvals: {
        Row: {
          acted_by: string | null
          action: Database["public"]["Enums"]["approval_action"]
          comment: string | null
          created_at: string
          expense_id: string
          id: string
        }
        Insert: {
          acted_by?: string | null
          action: Database["public"]["Enums"]["approval_action"]
          comment?: string | null
          created_at?: string
          expense_id: string
          id?: string
        }
        Update: {
          acted_by?: string | null
          action?: Database["public"]["Enums"]["approval_action"]
          comment?: string | null
          created_at?: string
          expense_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_approvals_acted_by_fkey"
            columns: ["acted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_approvals_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          parent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          parent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          parent?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category_id: string | null
          code: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"] | null
          id: string
          invoice_document_id: string | null
          is_demo: boolean
          is_recurring: boolean
          payment_method_id: string | null
          project_id: string | null
          proof_document_id: string | null
          recurring_expense_id: string | null
          state: Database["public"]["Enums"]["transaction_state"]
          status: Database["public"]["Enums"]["expense_status"]
          submitted_by: string | null
          txn_date: string
          updated_at: string
          vendor: string | null
          voided: boolean
          voided_reason: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"] | null
          id?: string
          invoice_document_id?: string | null
          is_demo?: boolean
          is_recurring?: boolean
          payment_method_id?: string | null
          project_id?: string | null
          proof_document_id?: string | null
          recurring_expense_id?: string | null
          state?: Database["public"]["Enums"]["transaction_state"]
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by?: string | null
          txn_date?: string
          updated_at?: string
          vendor?: string | null
          voided?: boolean
          voided_reason?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"] | null
          id?: string
          invoice_document_id?: string | null
          is_demo?: boolean
          is_recurring?: boolean
          payment_method_id?: string | null
          project_id?: string | null
          proof_document_id?: string | null
          recurring_expense_id?: string | null
          state?: Database["public"]["Enums"]["transaction_state"]
          status?: Database["public"]["Enums"]["expense_status"]
          submitted_by?: string | null
          txn_date?: string
          updated_at?: string
          vendor?: string | null
          voided?: boolean
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_invoice_document_id_fkey"
            columns: ["invoice_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_proof_document_id_fkey"
            columns: ["proof_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_expenses_recurring"
            columns: ["recurring_expense_id"]
            isOneToOne: false
            referencedRelation: "recurring_expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      income_transactions: {
        Row: {
          amount: number
          client_id: string | null
          code: string | null
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          id: string
          income_type: Database["public"]["Enums"]["income_type"]
          invoice_id: string | null
          is_demo: boolean
          notes: string | null
          payment_method_id: string | null
          project_id: string | null
          proof_document_id: string | null
          reference: string | null
          state: Database["public"]["Enums"]["transaction_state"]
          txn_date: string
          updated_at: string
          voided: boolean
          voided_reason: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          income_type?: Database["public"]["Enums"]["income_type"]
          invoice_id?: string | null
          is_demo?: boolean
          notes?: string | null
          payment_method_id?: string | null
          project_id?: string | null
          proof_document_id?: string | null
          reference?: string | null
          state?: Database["public"]["Enums"]["transaction_state"]
          txn_date?: string
          updated_at?: string
          voided?: boolean
          voided_reason?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          id?: string
          income_type?: Database["public"]["Enums"]["income_type"]
          invoice_id?: string | null
          is_demo?: boolean
          notes?: string | null
          payment_method_id?: string | null
          project_id?: string | null
          proof_document_id?: string | null
          reference?: string | null
          state?: Database["public"]["Enums"]["transaction_state"]
          txn_date?: string
          updated_at?: string
          voided?: boolean
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "income_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "income_transactions_proof_document_id_fkey"
            columns: ["proof_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          description: string
          id: string
          invoice_id: string
          quantity: number
          sort_order: number
          unit_price: number
        }
        Insert: {
          amount?: number
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Update: {
          amount?: number
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          sort_order?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_paid: number
          client_id: string
          created_at: string
          created_by: string | null
          document_id: string | null
          due_date: string | null
          id: string
          is_demo: boolean
          issue_date: string
          notes: string | null
          number: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          client_id: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          is_demo?: boolean
          issue_date?: string
          notes?: string | null
          number: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          due_date?: string | null
          id?: string
          is_demo?: boolean
          issue_date?: string
          notes?: string | null
          number?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          note: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          note: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          code: string | null
          company: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          converted_client_id: string | null
          created_at: string
          created_by: string | null
          estimated_value: number
          expected_close: string | null
          expected_mrr: number
          id: string
          is_demo: boolean
          notes: string | null
          owner_id: string | null
          probability: number
          requirement: string | null
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
        }
        Insert: {
          code?: string | null
          company: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_client_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_value?: number
          expected_close?: string | null
          expected_mrr?: number
          id?: string
          is_demo?: boolean
          notes?: string | null
          owner_id?: string | null
          probability?: number
          requirement?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Update: {
          code?: string | null
          company?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          converted_client_id?: string | null
          created_at?: string
          created_by?: string | null
          estimated_value?: number
          expected_close?: string | null
          expected_mrr?: number
          id?: string
          is_demo?: boolean
          notes?: string | null
          owner_id?: string | null
          probability?: number
          requirement?: string | null
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_client_id_fkey"
            columns: ["converted_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          invoice_id: string | null
          is_demo: boolean
          notes: string | null
          paid_on: string
          payment_method_id: string | null
          proof_document_id: string | null
          reference: string | null
          updated_at: string
          voided: boolean
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          is_demo?: boolean
          notes?: string | null
          paid_on?: string
          payment_method_id?: string | null
          proof_document_id?: string | null
          reference?: string | null
          updated_at?: string
          voided?: boolean
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_id?: string | null
          is_demo?: boolean
          notes?: string | null
          paid_on?: string
          payment_method_id?: string | null
          proof_document_id?: string | null
          reference?: string | null
          updated_at?: string
          voided?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_proof_document_id_fkey"
            columns: ["proof_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string
          id: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          added_by: string | null
          created_at: string
          project_id: string
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          project_id: string
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_done: boolean
          project_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_done?: boolean
          project_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_done?: boolean
          project_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          closed_at: string | null
          closure_notes: string | null
          code: string | null
          contract_value: number
          created_at: string
          created_by: string | null
          description: string | null
          expected_end: string | null
          id: string
          is_demo: boolean
          mrr: number
          name: string
          notes: string | null
          one_time_value: number
          owner_id: string | null
          payment_terms: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          updated_at: string
        }
        Insert: {
          client_id: string
          closed_at?: string | null
          closure_notes?: string | null
          code?: string | null
          contract_value?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_end?: string | null
          id?: string
          is_demo?: boolean
          mrr?: number
          name: string
          notes?: string | null
          one_time_value?: number
          owner_id?: string | null
          payment_terms?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Update: {
          client_id?: string
          closed_at?: string | null
          closure_notes?: string | null
          code?: string | null
          contract_value?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_end?: string | null
          id?: string
          is_demo?: boolean
          mrr?: number
          name?: string
          notes?: string | null
          one_time_value?: number
          owner_id?: string | null
          payment_terms?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_expenses: {
        Row: {
          amount: number
          auto_create: boolean
          category_id: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          is_active: boolean
          is_demo: boolean
          name: string
          next_due: string | null
          require_approval: boolean
          start_date: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          amount: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name: string
          next_due?: string | null
          require_approval?: boolean
          start_date?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          auto_create?: boolean
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string
          next_due?: string | null
          require_approval?: boolean
          start_date?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_expenses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_revenues: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          is_active: boolean
          is_demo: boolean
          name: string | null
          next_billing: string | null
          project_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string | null
          next_billing?: string | null
          project_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_active?: boolean
          is_demo?: boolean
          name?: string | null
          next_billing?: string | null
          project_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_revenues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_revenues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_revenues_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_approve_expenses: { Args: never; Returns: boolean }
      can_manage_finance: { Args: never; Returns: boolean }
      can_see_project: { Args: { pid: string }; Returns: boolean }
      can_view_financials: { Args: never; Returns: boolean }
      generate_due_recurring_expenses: { Args: never; Returns: number }
      has_any_role: {
        Args: { roles: Database["public"]["Enums"]["user_role"][] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_authenticated: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      my_project_ids: { Args: never; Returns: string[] }
      notify_roles: {
        Args: {
          p_body: string
          p_link: string
          p_roles: Database["public"]["Enums"]["user_role"][]
          p_title: string
          p_type: Database["public"]["Enums"]["notification_type"]
        }
        Returns: undefined
      }
      project_closure_blockers: {
        Args: { p_project: string }
        Returns: string[]
      }
      recompute_invoice: { Args: { p_invoice: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      write_audit: {
        Args: {
          p_action: string
          p_entity: string
          p_entity_id: string
          p_new?: Json
          p_old?: Json
          p_summary: string
        }
        Returns: undefined
      }
    }
    Enums: {
      approval_action: "approved" | "rejected" | "changes_requested"
      client_status: "lead" | "prospect" | "active" | "inactive" | "archived"
      document_type:
        | "agreement"
        | "quotation"
        | "invoice"
        | "purchase_order"
        | "client_approval"
        | "final_acceptance"
        | "client_document"
        | "project_document"
        | "payment_proof"
        | "expense_proof"
        | "other"
      expense_status:
        | "draft"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "changes_requested"
        | "paid"
        | "void"
      income_type:
        | "one_time"
        | "recurring"
        | "advance"
        | "milestone"
        | "final_payment"
        | "other"
      invoice_status:
        | "draft"
        | "sent"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
      lead_stage:
        | "lead"
        | "discussion"
        | "proposal_sent"
        | "negotiation"
        | "won"
        | "agreement_pending"
        | "active"
        | "lost"
      notification_type:
        | "expense_submitted"
        | "expense_approved"
        | "expense_rejected"
        | "expense_changes_requested"
        | "invoice_overdue"
        | "payment_received"
        | "agreement_uploaded"
        | "project_closure_ready"
        | "project_closure_blocked"
        | "recurring_expense_due"
        | "lead_converted"
        | "generic"
      payment_status:
        | "pending"
        | "partially_paid"
        | "paid"
        | "overdue"
        | "cancelled"
        | "refunded"
      project_status:
        | "draft"
        | "agreement_pending"
        | "active"
        | "on_hold"
        | "completed"
        | "closure_pending"
        | "closed"
        | "cancelled"
      recurrence_frequency: "weekly" | "monthly" | "quarterly" | "yearly"
      transaction_state:
        | "expected"
        | "pending"
        | "approved"
        | "paid"
        | "cancelled"
      user_role:
        | "super_admin"
        | "admin"
        | "finance"
        | "project_manager"
        | "employee"
        | "viewer"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      approval_action: ["approved", "rejected", "changes_requested"],
      client_status: ["lead", "prospect", "active", "inactive", "archived"],
      document_type: [
        "agreement",
        "quotation",
        "invoice",
        "purchase_order",
        "client_approval",
        "final_acceptance",
        "client_document",
        "project_document",
        "payment_proof",
        "expense_proof",
        "other",
      ],
      expense_status: [
        "draft",
        "pending_approval",
        "approved",
        "rejected",
        "changes_requested",
        "paid",
        "void",
      ],
      income_type: [
        "one_time",
        "recurring",
        "advance",
        "milestone",
        "final_payment",
        "other",
      ],
      invoice_status: [
        "draft",
        "sent",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
      ],
      lead_stage: [
        "lead",
        "discussion",
        "proposal_sent",
        "negotiation",
        "won",
        "agreement_pending",
        "active",
        "lost",
      ],
      notification_type: [
        "expense_submitted",
        "expense_approved",
        "expense_rejected",
        "expense_changes_requested",
        "invoice_overdue",
        "payment_received",
        "agreement_uploaded",
        "project_closure_ready",
        "project_closure_blocked",
        "recurring_expense_due",
        "lead_converted",
        "generic",
      ],
      payment_status: [
        "pending",
        "partially_paid",
        "paid",
        "overdue",
        "cancelled",
        "refunded",
      ],
      project_status: [
        "draft",
        "agreement_pending",
        "active",
        "on_hold",
        "completed",
        "closure_pending",
        "closed",
        "cancelled",
      ],
      recurrence_frequency: ["weekly", "monthly", "quarterly", "yearly"],
      transaction_state: [
        "expected",
        "pending",
        "approved",
        "paid",
        "cancelled",
      ],
      user_role: [
        "super_admin",
        "admin",
        "finance",
        "project_manager",
        "employee",
        "viewer",
      ],
    },
  },
} as const
