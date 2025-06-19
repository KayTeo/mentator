import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

//TODO: Add first question asked, get/return, handle states
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const datasetId = body.dataset_id;

    if (!datasetId) {
      return new Response(JSON.stringify({ error: 'Dataset ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Query the dataset_data_points table
    const { data: dataPointsData, error: dataPointsError } = await supabase
      .from('dataset_data_points')
      .select(`
        data_point_id,
        metadata,
        data_points (
          id,
          content,
          label
        )
      `)
      .eq('dataset_id', datasetId);

    if (dataPointsError) {
      throw new Error(dataPointsError.message);
    }

    // Transform and sort the data points
    const points = dataPointsData
      ?.map(item => ({
        id: item.data_points?.id || '',
        content: item.data_points?.content || '',
        metadata: {
          ...item.metadata,
          loss_value: item.metadata?.loss_value ?? 0
        }
      }))
      .filter(point => point.id && point.content)
      .sort((a, b) => (b.metadata.loss_value || 0) - (a.metadata.loss_value || 0));

    if (!points?.length) {
      return new Response(JSON.stringify({ error: 'No data points found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ dataPoint: points[0] }), {
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
