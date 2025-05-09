-- Create datasets table
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create junction table for datasets and data points
CREATE TABLE dataset_data_points (
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    data_point_id UUID NOT NULL REFERENCES data_points(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (dataset_id, data_point_id)
);

-- Create indexes
CREATE INDEX idx_datasets_user_id ON datasets(user_id);
CREATE INDEX idx_dataset_data_points_dataset_id ON dataset_data_points(dataset_id);
CREATE INDEX idx_dataset_data_points_data_point_id ON dataset_data_points(data_point_id);

-- Add RLS policies for datasets
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own datasets"
    ON datasets
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own datasets"
    ON datasets
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own datasets"
    ON datasets
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own datasets"
    ON datasets
    FOR DELETE
    USING (auth.uid() = user_id);

-- Add RLS policies for dataset_data_points
ALTER TABLE dataset_data_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own dataset data points"
    ON dataset_data_points
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM datasets
            WHERE datasets.id = dataset_data_points.dataset_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own dataset data points"
    ON dataset_data_points
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM datasets
            WHERE datasets.id = dataset_data_points.dataset_id
            AND datasets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own dataset data points"
    ON dataset_data_points
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM datasets
            WHERE datasets.id = dataset_data_points.dataset_id
            AND datasets.user_id = auth.uid()
        )
    );

-- Create trigger for updated_at on datasets
CREATE TRIGGER update_datasets_updated_at
    BEFORE UPDATE ON datasets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 