import { CardDetails, SimulationInput} from "@probi-oh/types";
import { BaseCondition } from "./condition";

export interface DataFileManager {
    importFromString(data: string): Promise<SimulationInput>;
    exportDeckToString(deck: Map<string, CardDetails>): Promise<string>;
    exportConditionsToString(conditions: BaseCondition[]): Promise<string>;
    exportSimulationToString(simulation: SimulationInput): Promise<string>;
}