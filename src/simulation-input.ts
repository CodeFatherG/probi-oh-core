import { CardDetails } from "@probi-oh/types";

export interface SimulationInput {
    deck: Map<string, CardDetails>;
    conditions: string[];
}