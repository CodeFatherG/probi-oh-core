import yaml from 'js-yaml';
import { CardDetails, Condition, SimulationInput } from "@probi-oh/types";
import { DataFileManager } from './data-file';
import { conditionToString } from './condition';
import { parseCondition } from './parser';

class YamlManager implements DataFileManager {
    private static instance: YamlManager;

    public static getInstance(): YamlManager {
        if (!YamlManager.instance) {
            YamlManager.instance = new YamlManager();
        }
        return YamlManager.instance;
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
    public async importFromString(yamlString: string): Promise<SimulationInput> {
        try {

            const input = yaml.load(yamlString) as { deck: Map<string, CardDetails>, conditions: string[] };

            // Validate deck structure
            for (const [cardName, cardDetails] of Object.entries(input.deck)) {
                if (typeof cardDetails !== 'object' || Array.isArray(cardDetails)) {
                    throw new Error(`Invalid card details for ${cardName}`);
                }
                if (typeof cardDetails.qty !== 'number') {
                    throw new Error(`Invalid card structure for ${cardName}`);
                }
            }

            return {
                deck: this.getCardList(input.deck),
                conditions: input.conditions ?Array.from(input.conditions.flatMap(condition => {
                    return parseCondition(condition);
                })) : []
            };
        } catch (error) {
            throw new Error(`Failed to parse YAML: ${(error as Error).message}`);
        }
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
        return yaml.dump({ deck: deckObject });
    }

    /**
     * serialises conditions to YAML format
     * @param conditions - The conditions to serialise
     */
    public async exportConditionsToString(conditions: Condition[]): Promise<string> {
        const conditionStrings = conditions.map(condition => conditionToString(condition));
        return yaml.dump({ conditions: conditionStrings });
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
        const conditionsYaml = yaml.dump({ conditions: input.conditions });
        return deckYaml + '\n' + conditionsYaml;
    }
}

export default YamlManager.getInstance();
