import yamlManager from '../src/yaml-manager';
import * as yaml from 'js-yaml';
import { CardDetails, Condition, ConditionLocation, ConditionOperator, ConditionType, LogicCondition, SimulationInput } from "@probi-oh/types";

// Mock ProgressEvent
class MockProgressEvent {
    type: string;
    target: any;

    constructor(type: string, init?: { target?: any }) {
        this.type = type;
        this.target = init?.target;
    }
}

// Mock File
class MockFile implements Partial<File> {
    name: string;
    private content: string;

    constructor(bits: BlobPart[], filename: string, options?: FilePropertyBag) {
        this.name = filename;
        this.content = bits.join('');
    }

    text(): Promise<string> {
        return Promise.resolve(this.content);
    }
}

class MockFileReader implements Partial<FileReader> {
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    result: string | ArrayBuffer | null = null;

    readAsText(file: Blob): void {
        setTimeout(async () => {
            try {
                if (file instanceof MockFile) {
                    this.result = await file.text();
                    if (this.onload) {
                        const event = new MockProgressEvent('load', { target: this });
                        this.onload.call(this as unknown as FileReader, event as ProgressEvent<FileReader>);
                    }
                }
            } catch (error) {
                if (this.onerror) {
                    const event = new MockProgressEvent('error', { target: this });
                    this.onerror.call(this as unknown as FileReader, event as ProgressEvent<FileReader>);
                }
            }
        }, 0);
    }
}

describe('YAML Manager', () => {
    beforeEach(() => {
        // Apply mocks
        (global as any).File = MockFile;
        (global as any).FileReader = MockFileReader;
        (global as any).ProgressEvent = MockProgressEvent;

        jest.resetAllMocks();
    });
    
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('yamlManager.importFromString', () => {
        it('should correctly parse a valid YAML string', async () => {
            const yamlString = `
                deck:
                    Card1:
                        qty: 3
                        tags: [Tag1, Tag2]
                    Card2:
                        qty: 2
                        tags: [Tag3]
                conditions:
                    - 2+ Card1
                    - (1 Card2 OR 2 Card1)
            `;
            const result = await yamlManager.importFromString(yamlString);
            
            expect(result.conditions).toHaveLength(2);
            expect(result.deck.get('Card1')?.qty).toBe(3);
            expect(result.deck.get('Card2')?.qty).toBe(2);
            expect(result.conditions[0]).toBe('2+ Card1');
            expect(result.conditions[1]).toBe('(1 Card2 OR 2 Card1)');
        });

        it('should handle no quantity specified', async () => {
            const yamlString = `
                deck:
                    Card1:
                        qty: 1
            `;
            const result = await yamlManager.importFromString(yamlString);
            
            expect(result.deck).toBeInstanceOf(Map);
            expect(result.deck.size).toBe(1);
            expect(result.deck.get('Card1')?.qty).toBe(1);
        });

        it('should throw an error for invalid deck structure', async () => {
            const invalidYaml = `
              deck:
                invalidCard: 'not an object'
              conditions: []
            `;
            await expect(yamlManager.importFromString(invalidYaml)).rejects.toThrow('Failed to parse YAML: Invalid card details for invalidCard');
        });
          
        it('should throw an error for invalid card structure', async () => {
            const invalidYaml = `
              deck:
                Card1:
                  qty: 'not a number'
                  tags: 'not an array'
              conditions: []
            `;
            await expect(yamlManager.importFromString(invalidYaml)).rejects.toThrow('Failed to parse YAML: Invalid card structure for Card1');
        });
    });

    describe('serialiseDeckToYaml', () => {
        it('should correctly serialise a deck to YAML', async () => {
            const cards = new Map<string, CardDetails>([
                ['Card1', { qty: 2, tags: ['Tag1', 'Tag2'] }],
                ['Card2', { tags: ['Tag3'] }]
            ]);
            const result = await yamlManager.exportDeckToString(cards);
            const parsed = yaml.load(result) as { deck: any };
            expect(parsed.deck.Card1.qty).toBe(2);
            expect(parsed.deck.Card2.qty).toBe(undefined);
        });

        it('should correctly handle duplicate cards', async () => {
            const cards = new Map<string, CardDetails>([
                ['Card1', { qty: 2, tags: ['Tag1'] }],
                ['Card2', { tags: ['Tag2'] }],
            ]);
            const result = await yamlManager.exportDeckToString(cards);
            const parsed = yaml.load(result) as { deck: any };
            expect(parsed.deck.Card1.qty).toBe(2);
            expect(parsed.deck.Card2.qty).toBe(undefined);
        });
    });

    describe('yamlManager.exportConditionsToString', () => {
        it('should correctly serialise conditions to YAML', async () => {
            const conditions: Condition[] = [
                {
                    kind: 'card',
                    cardName: 'Card1', 
                    cardCount: 2, 
                    operator: ConditionOperator.AT_LEAST,
                    location: ConditionLocation.HAND
                },
                {
                    kind: 'logic',
                    type: ConditionType.OR,
                    conditionA: {
                        kind: 'card',
                        cardName: 'Card2',
                        cardCount: 1,
                        operator: ConditionOperator.EXACTLY,
                        location: ConditionLocation.HAND
                    },
                    conditionB: {
                        kind: 'card',
                        cardName: 'Card1',
                        cardCount: 2,
                        operator: ConditionOperator.AT_LEAST,
                        location: ConditionLocation.HAND
                    },
                    render: {
                        hasParentheses: false
                    }
                }
            ];
            const result = await yamlManager.exportConditionsToString(conditions);
            const parsed = yaml.load(result) as { conditions: string[] };
            expect(parsed.conditions).toHaveLength(2);
            expect(parsed.conditions[0]).toBe('2+ Card1 IN HAND');
            expect(parsed.conditions[1]).toBe('1 Card2 IN HAND OR 2+ Card1 IN HAND');
        });

        it('should correctly serialise complex conditions', async () => {
            const condition: LogicCondition = {
                kind: 'logic',
                type: ConditionType.AND,
                conditionA: {
                    kind: 'card',
                    cardName: 'Card1',
                    cardCount: 2,
                    operator: ConditionOperator.AT_LEAST,
                    location: ConditionLocation.HAND
                },
                conditionB: {
                    kind: 'logic',
                    type: ConditionType.OR,
                    conditionA: {
                        kind: 'card',
                        cardName: 'Card2',
                        cardCount: 1,
                        operator: ConditionOperator.EXACTLY,
                        location: ConditionLocation.HAND
                    },
                    conditionB: {
                        kind: 'card',
                        cardName: 'Card3',
                        cardCount: 3,
                        operator: ConditionOperator.NO_MORE,
                        location: ConditionLocation.HAND
                    },
                    render: {
                        hasParentheses: true
                    }
                },
                render: {
                    hasParentheses: false
                }
            };
            const result = await yamlManager.exportConditionsToString([condition]);
            const parsed = yaml.load(result) as { conditions: string[] };
            expect(parsed.conditions[0]).toBe('2+ Card1 IN HAND AND (1 Card2 IN HAND OR 3- Card3 IN HAND)');
        });
    });

    describe('serialiseSimulationInputToYaml', () => {
        it('should correctly serialise a complete simulation input to YAML', async () => {
            const deck = new Map([
                ['Card1', { tags: ['Tag1'] }],
                ['Card2', { tags: ['Tag2'] }]
            ]);
            const conditions = [
                '1+ Card1',
                '(Card1 AND Card2)'
            ];
            const input: SimulationInput = { deck, conditions };
            const result = await yamlManager.exportSimulationToString(input);
            const parsed = yaml.load(result) as { deck: any, conditions: string[] };
            expect(parsed.deck.Card1.qty).toBe(undefined);
            expect(parsed.deck.Card2.qty).toBe(undefined);
            expect(parsed.conditions).toHaveLength(2);
        });
    });
});

describe('Edge Cases', () => {
    it('should deserialise a condition with a numbered card name', async () => {
        const yamlString = `
            deck:
                1:
                    qty: 3
                    tags: [Tag1, Tag2]
                2:
                    qty: 2
                    tags: [Tag3]
            conditions:
                - 2+ 1
                - (1 2 OR 2 1)
        `;
        const result = await yamlManager.importFromString(yamlString);
        
        expect(result.deck.size).toBe(2);
        expect(result.conditions).toHaveLength(2);
        expect(result.conditions[0]).toBe('2+ 1');
        expect(result.conditions[1]).toBe('(1 2 OR 2 1)');
    });

    describe('Handle "" card names', () => {
        it('should deserialise a condition with card name starting ""', async () => {
            const yamlString = `
                deck:
                    "Card A":
                        qty: 3
                        tags: [Tag1, Tag2]
                conditions:
                    - 2+ "Card A"
            `;
            const result = await yamlManager.importFromString(yamlString);
            
            expect(result.deck.size).toBe(1);
            expect(result.conditions).toHaveLength(1);
            expect(result.conditions[0]).toBe('2+ "Card A"');
        });
    });
});