-- Move label column from dataset_data_points to data_points table
ALTER TABLE dataset_data_points
DROP COLUMN label;

ALTER TABLE data_points
ADD COLUMN label TEXT; 