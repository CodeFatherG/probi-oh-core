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
    public async importFromString(yamlString: string): Promise<SimulationInput> {
        try {

            const input = yaml.load(yamlString) as { deck: Map<string, CardDetails>, conditions: string[], deckName?: string };

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
                conditions: input.conditions ? input.conditions.map(condition => {
                    return parseCondition(condition);
                }) : [],
                deckName: input.deckName ?? "Unnamed Deck"
            };
        } catch (error) {
            throw new Error(`Failed to parse YAML: ${(error as Error).message}`);
        }
    }

    public async exportDeckToString(cards: Record<string, CardDetails>): Promise<string> {
        return yaml.dump({ deck: cards });
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
        const deckYaml = await this.exportDeckToString(input.deck);
        const conditionsYaml = await this.exportConditionsToString(input.conditions);
        return deckYaml + '\n' + conditionsYaml;
    }
}

export default YamlManager.getInstance();
