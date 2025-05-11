
-- Add UPDATE policy for dataset_data_points
CREATE POLICY "Users can update their own dataset data points"
    ON dataset_data_points
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM datasets
            WHERE datasets.id = dataset_data_points.dataset_id
            AND datasets.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM datasets
            WHERE datasets.id = dataset_data_points.dataset_id
            AND datasets.user_id = auth.uid()
        )
    ); 