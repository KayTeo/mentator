/**
 * TypeScript definitions for Supabase database tables
 * Generated for the Mentator app
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      learning_data: {
        Row: {
          id: string
          user_id: string
          content: string
          tags: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          tags?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_data_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      splitting_methods: {
        Row: {
          id: string
          name: string
          description: string | null
          implementation: string
          user_id: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          implementation: string
          user_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          implementation?: string
          user_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "splitting_methods_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      scheduling_methods: {
        Row: {
          id: string
          name: string
          description: string | null
          implementation: string
          user_id: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          implementation: string
          user_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          implementation?: string
          user_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduling_methods_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      training_methods: {
        Row: {
          id: string
          name: string
          description: string | null
          implementation: string
          requires_llm: boolean
          user_id: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          implementation: string
          requires_llm?: boolean
          user_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          implementation?: string
          requires_llm?: boolean
          user_id?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_methods_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      decks: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          splitting_method_id: string
          scheduling_method_id: string
          training_method_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          splitting_method_id: string
          scheduling_method_id: string
          training_method_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          splitting_method_id?: string
          scheduling_method_id?: string
          training_method_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decks_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decks_splitting_method_id_fkey"
            columns: ["splitting_method_id"]
            referencedRelation: "splitting_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decks_scheduling_method_id_fkey"
            columns: ["scheduling_method_id"]
            referencedRelation: "scheduling_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decks_training_method_id_fkey"
            columns: ["training_method_id"]
            referencedRelation: "training_methods"
            referencedColumns: ["id"]
          }
        ]
      }
      deck_items: {
        Row: {
          id: string
          deck_id: string
          learning_data_id: string
          created_at: string
        }
        Insert: {
          id?: string
          deck_id: string
          learning_data_id: string
          created_at?: string
        }
        Update: {
          id?: string
          deck_id?: string
          learning_data_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_items_deck_id_fkey"
            columns: ["deck_id"]
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deck_items_learning_data_id_fkey"
            columns: ["learning_data_id"]
            referencedRelation: "learning_data"
            referencedColumns: ["id"]
          }
        ]
      }
      learning_sessions: {
        Row: {
          id: string
          user_id: string
          deck_id: string
          started_at: string
          ended_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          deck_id: string
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          deck_id?: string
          started_at?: string
          ended_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_sessions_deck_id_fkey"
            columns: ["deck_id"]
            referencedRelation: "decks"
            referencedColumns: ["id"]
          }
        ]
      }
      learning_attempts: {
        Row: {
          id: string
          session_id: string
          deck_item_id: string
          input_data: string
          prediction: string | null
          expected_output: string
          performance_score: number | null
          feedback: string | null
          next_review_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          deck_item_id: string
          input_data: string
          prediction?: string | null
          expected_output: string
          performance_score?: number | null
          feedback?: string | null
          next_review_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          deck_item_id?: string
          input_data?: string
          prediction?: string | null
          expected_output?: string
          performance_score?: number | null
          feedback?: string | null
          next_review_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_attempts_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "learning_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_attempts_deck_item_id_fkey"
            columns: ["deck_item_id"]
            referencedRelation: "deck_items"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 