import { Database } from "@/types/database";
import { SupabaseClient } from "@supabase/supabase-js";

export function learning_algorithm(data_edges: Database['public']['Tables']['data_points']['Row'][]) {

  const return_data_edges: Database['public']['Tables']['data_points']['Row'][] = [];
  console.log(data_edges);
  data_edges.forEach(data_edge => {
      // Weird fix for linter type error
      if (!data_edge.metadata || typeof data_edge.metadata !== 'object' || Array.isArray(data_edge.metadata)) {
          data_edge.metadata = {};
      }
      console.log(data_edge);
      // Ensure last_studied is an object
      if (!('last_studied' in data_edge.metadata) || typeof data_edge.metadata.last_studied !== 'object' || data_edge.metadata.last_studied === null || Array.isArray(data_edge.metadata.last_studied)) {
          data_edge.metadata.last_studied = {};
      }

      // Set default date if missing
      if (!('date' in data_edge.metadata.last_studied)) {
          data_edge.metadata.last_studied.date = new Date(-8640000000000000).toISOString();
      }

      // Set default number_of_times_studied if missing
      if (!('number_of_times_studied' in data_edge.metadata) || typeof data_edge.metadata.number_of_times_studied !== 'number') {
          data_edge.metadata.number_of_times_studied = 0;
      }

      // Set default loss_value if missing
      if (!('loss_value' in data_edge.metadata) || typeof data_edge.metadata.loss_value !== 'number') {
          data_edge.metadata.loss_value = 1;
      }

      const days_passed = Math.floor(
          (new Date().getTime() - new Date(String(data_edge.updated_at)).getTime()) / (1000 * 60 * 60 * 24)
      );
      console.log(days_passed, 2**data_edge.metadata.number_of_times_studied - 1)

      if (
          days_passed > 2**data_edge.metadata.number_of_times_studied - 1 ||
          data_edge.metadata.loss_value > 0.5
      ) {
          console.log("Pushing data edge", data_edge);
          return_data_edges.push(data_edge);
      }
  });



  return return_data_edges;
}

export function getLossValue(grade: string) {
  if (grade === 'A') {
    return 0;
  } else if (grade === 'B') {
    return 0.25;
  } else if (grade === 'C') {
    return 0.5;
  } else if (grade === 'D') {
    return 0.75;
  } else if (grade === 'F') {
    return 1;
  }
  return 1;
}

/**
 * Fetches all datasets for the current user
 * @param supabase - The Supabase client instance
 * @returns Promise resolving to an array of datasets
 */
export async function fetchDatasets(
  supabase: SupabaseClient<Database>
): Promise<Database['public']['Tables']['datasets']['Row'][]> {
  try {
    const { data, error } = await supabase
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error('Failed to fetch datasets');
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching datasets:', error);
    throw error;
  }
}

/**
 * Fetches due cards for a specific dataset that need reviewing
 * @param datasetId - The ID of the dataset to fetch cards from
 * @param supabase - The Supabase client instance
 * @returns Promise resolving to an array of data points that need reviewing
 */
export async function fetchDueCards(
  datasetId: string, 
  supabase: SupabaseClient<Database>
): Promise<Database['public']['Tables']['data_points']['Row'][]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Query dataset_data_points and join with data_points to get actual content
    const { data, error } = await supabase
      .from('dataset_data_points')
      .select(`
        data_point_id,
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

    if (error) {
      throw new Error('Failed to fetch due cards');
    }

    if (data) {
      // Extract the data_points from the joined result and flatten
      const dataPoints = data
        .map(row => row.data_points)
        .flat()
        .filter(point => point !== null) as Database['public']['Tables']['data_points']['Row'][];
      
      // Apply learning algorithm to get cards that need reviewing
      const processedCards = learning_algorithm(dataPoints);
      return processedCards;
    }

    return [];
  } catch (error) {
    console.error('Error fetching due cards:', error);
    throw error;
  }
}

export async function updateCardLoss(
  grade: string, 
  userAnswer: string, 
  currentCard: Database['public']['Tables']['data_points']['Row'], 
  supabase: SupabaseClient<Database>
  ) {

  console.log("Updating card loss", currentCard, grade, userAnswer);
  const currentMetadata = currentCard?.metadata;
  const metadata = {
    grade: grade,
    user_answer: userAnswer,
    last_studied: new Date().toISOString(),
    number_of_times_studied: (typeof currentMetadata === 'object' && currentMetadata && 'number_of_times_studied' in currentMetadata && typeof currentMetadata.number_of_times_studied === 'number' ? currentMetadata.number_of_times_studied : 0) + 1,
    loss_value: getLossValue(grade),
  }
  if (currentCard) {
    const { error } = await supabase
      .from('data_points')
      .update({ metadata: metadata })
      .eq('id', currentCard.id);
    
    if (error) {
      console.error('Error updating card loss:', error);
    }
  }
}

