import { CardDetails, Condition, SimulationInput } from "@probi-oh/types";
import { DataFileManager } from './data-file';
import { conditionToString } from './condition';

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
    private getCardList(deckList: Map<string, CardDetails> | Record<string, CardDetails>): Map<string, CardDetails> {
        const cards: Map<string, CardDetails> = new Map<string, CardDetails>();
        for (const [card, details] of Object.entries(deckList)) {
            const qty = details.qty ?? 1;

            details.qty = qty;

            // Add the card
            cards.set(card, details);
        }

        return cards;
    }

    /**
     * Loads a SimulationInput from a YAML string
     * @param yamlString - The YAML string to parse
     */
    public async importFromString(jsonString: string): Promise<SimulationInput> {
        const input: SimulationInput = {
            deck: new Map<string, CardDetails>(),
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

    public async exportDeckToString(cards: Map<string, CardDetails>): Promise<string> {
        const deckObject: Record<string, CardDetails> = {};
        Array.from(cards.entries()).forEach(([card, details]) => {
            if (card !== 'Empty Card') {
                if (deckObject[card]) {
                    const cardDetails = deckObject[card];
                    if (cardDetails) {
                        cardDetails.qty = (cardDetails.qty || 1) + 1;
                    }
                } else {
                    deckObject[card] = details;
                }
            }
        });
        return JSON.stringify(deckObject);
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
        const deck: Record<string, CardDetails> = {};

        for (const [card, details] of input.deck) {
            deck[card] = details;
        }

        const deckYaml = await this.exportDeckToString(input.deck);
        const conditionsYaml = await this.exportConditionsToString(input.conditions);
        return deckYaml + '\n' + conditionsYaml;
    }
}

export default JsonManager.getInstance();
