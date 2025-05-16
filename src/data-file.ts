import { CardDetails, Condition, SimulationInput} from "@probi-oh/types";

export interface DataFileManager {
    importFromString(data: string): Promise<SimulationInput>;
    exportDeckToString(deck: Map<string, CardDetails>): Promise<string>;
    exportConditionsToString(conditions: Condition[]): Promise<string>;
    exportSimulationToString(simulation: SimulationInput): Promise<string>;
}