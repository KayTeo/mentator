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
      data_points: {
        Row: {
          id: string
          user_id: string
          content: string
          label: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          label?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          label?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      datasets: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      dataset_data_points: {
        Row: {
          dataset_id: string
          data_point_id: string
          metadata: Json
          created_at: string
        }
        Insert: {
          dataset_id: string
          data_point_id: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          dataset_id?: string
          data_point_id?: string
          metadata?: Json
          created_at?: string
        }
      }
    }
  }
} 