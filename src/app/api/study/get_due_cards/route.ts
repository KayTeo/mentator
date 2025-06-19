import { createClient } from '@supabase/supabase-js';
import { learning_algorithm } from '@/lib/learning_algorithm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

//TODO: Add first question asked, get/return, handle states
// This is hasty and very inefficient
export async function POST(req: Request) {
  try {
    console.log("Getting due cards");
    const body = await req.json();
    const datasetId = body.dataset_id;
    console.log("Dataset ID is" + datasetId);
    if (!datasetId) {
      return new Response(JSON.stringify({ error: 'Dataset ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Query the dataset_data_points table and join with data_points
    const { data: datasetPointsData, error: dataPointsError } = await supabase
      .from('dataset_data_points')
      .select(`
        data_points (
          id,
          user_id,
          content,
          label,
          created_at,
          updated_at,
          metadata
        )
      `)
      .eq('dataset_id', datasetId);

    if (dataPointsError) {
      throw new Error(dataPointsError.message);
    }
    console.log("Dataset points data is" + datasetPointsData);
    // Flatten and extract just the data_points
    const dataPointsArray = datasetPointsData?.map(row => row.data_points).flat();
    console.log("Data points array is" + dataPointsArray);
    // Transform and sort the data points
    const points = learning_algorithm(dataPointsArray);


    if (!points?.length) {
      return new Response(JSON.stringify({ error: 'No data points found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ dataPoints: points }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Failed to fetch next question' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
