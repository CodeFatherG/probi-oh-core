import { CardDetails, Condition, SimulationInput } from "@probi-oh/types";
import { DataFileManager } from './data-file';

class JsonManager implements DataFileManager {
    private static instance: JsonManager;

    public static getInstance(): JsonManager {
        if (!JsonManager.instance) {
            JsonManager.instance = new JsonManager();
        }
        return JsonManager.instance;
    }

    /**
     * Builds a deck from a record of card details
     * @param deckList - Record of card names and their details
     * @returns A new Deck instance
     */
    private getCardList(deckList: Map<string, CardDetails> | Record<string, CardDetails>): Record<string, CardDetails> {
        const cards: Record<string, CardDetails> = {};
        for (const [card, details] of Object.entries(deckList)) {
            const qty = details.qty ?? 1;

            details.qty = qty;

            // Add the card
            cards[card] = details;
        }

        return cards;
    }

    /**
     * Loads a SimulationInput from a YAML string
     * @param yamlString - The YAML string to parse
     */
    public async importFromString(jsonString: string): Promise<SimulationInput> {
        const input: SimulationInput = {
            deck: {},
            conditions: [],
        };

        const parsed = JSON.parse(jsonString);
        input.deck = this.getCardList(parsed.deck);
        input.conditions = parsed.conditions;

        if (parsed.deckName) {   
            input.deckName = parsed.deckName;
        }

        return input;
    }

    public async exportDeckToString(cards: Record<string, CardDetails>): Promise<string> {
        // Filter out cards with name "Empty Card"
        const filteredCards = Object.fromEntries(
            Object.entries(cards).filter(([name]) => name !== "Empty Card")
        );
        return JSON.stringify(filteredCards);
    }

    /**
     * serialises conditions to YAML format
     * @param conditions - The conditions to serialise
     */
    public async exportConditionsToString(conditions: Condition[]): Promise<string> {
        return JSON.stringify(conditions);
    }

    /**
     * serialises a SimulationInput to YAML format
     * @param input - The SimulationInput to serialise
     */
    public async exportSimulationToString(input: SimulationInput): Promise<string> {
        return JSON.stringify(input);
    }
}

export default JsonManager.getInstance();
