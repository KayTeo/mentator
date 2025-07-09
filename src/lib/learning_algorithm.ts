import { Database } from "@/types/database";

export function learning_algorithm(data_edges: Database['public']['Tables']['data_points']['Row'][]) {

    var return_data_edges: Database['public']['Tables']['data_points']['Row'][] = [];
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