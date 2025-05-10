-- Create data_points table
CREATE TABLE data_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX idx_data_points_user_id ON data_points(user_id);

-- Create index on created_at for sorting
CREATE INDEX idx_data_points_created_at ON data_points(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE data_points ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own data points
CREATE POLICY "Users can view their own data points"
    ON data_points
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own data points
CREATE POLICY "Users can insert their own data points"
    ON data_points
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own data points
CREATE POLICY "Users can update their own data points"
    ON data_points
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own data points
CREATE POLICY "Users can delete their own data points"
    ON data_points
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_data_points_updated_at
    BEFORE UPDATE ON data_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 