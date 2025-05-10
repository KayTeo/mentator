-- Add metadata column to dataset_data_points table
ALTER TABLE dataset_data_points
ADD COLUMN metadata JSONB; 