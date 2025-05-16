import { CardCondition, ConditionLocation, ConditionOperator, ConditionType, LogicCondition } from '@probi-oh/types';
import { Card, CreateCard } from '../src/card';
import { Deck } from '../src/deck';
import { GameState } from '../src/game-state';
import { cardsThatSatisfy, evaluateCondition } from '../src/condition';

describe('Condition', () => {
    let testCards: Card[];
    let testDeck: Card[];
    let mockGameState: jest.Mocked<GameState>;
    let mockDeck: jest.Mocked<Deck>;

    beforeEach(() => {
        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
            CreateCard('Card C', { tags: ['Tag1', 'Tag3'] }),
        ];
        testDeck = [...Array(40)].map((_, i) => CreateCard(`Deck Card ${i}`, {}));
        
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        Object.defineProperty(mockDeck, 'deckList', {
            get: jest.fn().mockImplementation(() => { return testDeck; })
        });
        mockDeck.deepCopy = jest.fn().mockReturnValue(mockDeck);
        mockDeck.shuffle = jest.fn();

        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return testCards; })
        });
        Object.defineProperty(mockGameState, 'deck', {
            get: jest.fn().mockImplementation(() => { return mockDeck; })
        });
        mockGameState.deepCopy = jest.fn().mockReturnValue(mockGameState);
    });

    test('should evaluate correctly for card name', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Card A',
            cardCount: 1,
            location: ConditionLocation.HAND,
            operator: ConditionOperator.EXACTLY,
        }
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly for tag', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount: 1,
            location: ConditionLocation.HAND,
            operator: ConditionOperator.EXACTLY,
        }
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly with quantity', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Tag1', 
            cardCount: 2, 
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,
        };
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(condition.successes).toBe(1);
    });

    test('should evaluate correctly with different operators', () => {
        const equalCondition: CardCondition = {
            kind: 'card',
            cardName: 'Tag1', 
            cardCount: 2, 
            operator: ConditionOperator.EXACTLY,
            location: ConditionLocation.HAND,
        };
        expect(evaluateCondition(equalCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);

        const lessEqualCondition: CardCondition = {
            kind: 'card',
            cardName: 'Tag3', 
            cardCount: 1, 
            operator: ConditionOperator.NO_MORE,
            location: ConditionLocation.HAND,
        };
        expect(evaluateCondition(lessEqualCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
    });
    
    test('should evaluate correctly with quantity and <= operator', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Tag1', 
            cardCount: 2, 
            operator: ConditionOperator.NO_MORE,
            location: ConditionLocation.HAND,
        };
        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1'] }),
            CreateCard('Card C', { tags: ['Tag1'] }),
        ];
        
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        // expect(condition.successes).toBe(0);
    });

    test('should evaluate correctly with exact quantity', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount:  2,
            operator:  ConditionOperator.EXACTLY,
            location: ConditionLocation.HAND,
        };
        testCards = [
            CreateCard('Card A', { tags: ['Tag2'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
        ];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(condition.successes).toBe(1);
    });

    test('should handle cards with multiple tags', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Tag3', 
            cardCount: 2, 
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,
        };
        testCards = [
            CreateCard('Card A', { tags: ['Tag1', 'Tag3'] }),
            CreateCard('Card B', { tags: ['Tag2', 'Tag3'] }),
            CreateCard('Card C', { tags: ['Tag3', 'Tag4'] }),
        ];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(condition.successes).toBe(1);
    });

    it('should evaluate greater than or equal correctly', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Test Card', 
            cardCount: 2, 
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,
        };
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        testCards = [CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
    });

    it('should evaluate less than or equal correctly', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Test Card', 
            cardCount: 2, 
            operator: ConditionOperator.NO_MORE,
            location: ConditionLocation.HAND,
        };
        testCards = [CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
    });

    it('should evaluate equal correctly', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Test Card',
            cardCount:  2,
            operator:  ConditionOperator.EXACTLY,
            location: ConditionLocation.HAND,
        };
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        testCards = [CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        testCards = [CreateCard('Test Card', {}), CreateCard('Test Card', {}), CreateCard('Test Card', {})];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
    });

    it('should handle card tags', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'TestTag', 
            cardCount: 1, 
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,
        };
        testCards = [CreateCard('Different Card', { tags: ['TestTag'] })];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        testCards = [CreateCard('Different Card', { tags: ['OtherTag'] })];
        expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
    });

    describe('Location targets', () => {
        it ('should evaluate correctly for deck', () => {
            const condition: CardCondition = {
                kind: 'card',
                cardName: 'Test Card', 
                cardCount: 1, 
                operator: ConditionOperator.EXACTLY,
                location: ConditionLocation.DECK,
            };
            testDeck = [CreateCard('Test Card', {})];
            expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
            testDeck = [CreateCard('Different Card', {})];
            expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        });

        it ('should evaluate correctly for hand', () => {
            const condition: CardCondition = {
                kind: 'card',
                cardName: 'Test Card', 
                cardCount: 1, 
                operator: ConditionOperator.EXACTLY,
                location: ConditionLocation.HAND,
            };
            testCards = [CreateCard('Test Card', {})];
            expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
            testCards = [CreateCard('Different Card', {})];
            expect(evaluateCondition(condition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        });
    });
});

describe('AndCondition', () => {
    let testCards: Card[];
    let testDeck: Card[];
    let mockGameState: jest.Mocked<GameState>;
    let mockDeck: jest.Mocked<Deck>;

    beforeEach(() => {
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        testCards = [];
        testDeck = [...Array(40 - testCards.length)].map(i => CreateCard(`Deck Card ${i}`, {}));

        // Mock GameState properties and methods
        mockGameState.deepCopy = jest.fn().mockReturnValue(mockGameState);
        
        // Mock the hand getter
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return testCards; })
        });

        Object.defineProperty(mockDeck, 'deckList', {
            get: jest.fn().mockImplementation(() => { return testDeck; })
        });
    });

    test('should evaluate correctly', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Card A',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const andCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.AND,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(andCondition.successes).toBe(1);
    });

    test('should fail if one condition fails', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Card A',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Card C',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const andCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.AND,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        // expect(andCondition.successes).toBe(0);
    });

    test('should evaluate correctly with multiple conditions', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 2,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Card C',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const andCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.AND,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Card C', { tags: ['Tag3'] }),
        ];

        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(andCondition.successes).toBe(1);
    });

    test('should fail if any condition fails', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 2,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount: 1,
            operator: ConditionOperator.EXACTLY,
            location: ConditionLocation.HAND,    
        };
        const andCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.AND,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
        ];

        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        // expect(andCondition.successes).toBe(0);
    });

    test('should fail when a single card fulfills multiple conditions', () => {
    const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const andCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.AND,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };
        testCards = [
            CreateCard('Multi-Tag Card', { tags: ['Tag1', 'Tag2'] })
        ];
    
        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        // expect(andCondition.successes).toBe(0);
        // expect(condition1.successes).toBe(1);
        // expect(condition2.successes).toBe(0);
    });
    
    test('should handle satisfying the condition non linearly', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 2,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const andCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.AND,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        testCards = [
            CreateCard('Card 1', { tags: ['Tag1'] }),
            CreateCard('Multi tag Card', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Another Card 1', { tags: ['Tag1'] }),
        ];
    
        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(andCondition.successes).toBe(1);
    });
    
    test('should pass when different cards fulfill each condition', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const andCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.AND,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };
    
        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag2'] })
        ];
    
        expect(evaluateCondition(andCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(andCondition.successes).toBe(1);
    });
});

describe('OrCondition', () => {
    let testCards: Card[];
    let testDeck: Card[];
    let mockGameState: jest.Mocked<GameState>;
    let mockDeck: jest.Mocked<Deck>;

    beforeEach(() => {
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        testCards = [];
        testDeck = [...Array(40 - testCards.length)].map(i => CreateCard(`Deck Card ${i}`, {}));

        // Mock GameState properties and methods
        mockGameState.deepCopy = jest.fn().mockReturnValue(mockGameState);
        
        // Mock the hand getter
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return testCards; })
        });

        Object.defineProperty(mockDeck, 'deckList', {
            get: jest.fn().mockImplementation(() => { return testDeck; })
        });
    });

    test('should evaluate correctly', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Card A',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Card C',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const orCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.OR,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(evaluateCondition(orCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(orCondition.successes).toBe(1);
    });

    test('should fail if all conditions fail', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Card C',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Card D',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const orCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.OR,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        testCards = [
        CreateCard('Card A', { tags: ['Tag1'] }),
        CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(evaluateCondition(orCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
        // expect(orCondition.successes).toBe(0);
    });

    test('should evaluate correctly with multiple conditions', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 3,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount: 1,
            operator: ConditionOperator.EXACTLY,
            location: ConditionLocation.HAND,    
        };
        const orCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.OR,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
        ];

        expect(evaluateCondition(orCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(orCondition.successes).toBe(1);
    });

    test('should pass if any condition passes', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 3,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,    
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag3',
            cardCount: 1,
            operator: ConditionOperator.EXACTLY,
            location: ConditionLocation.HAND,    
        };
        const orCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.OR,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        testCards = [
            CreateCard('Card A', { tags: ['Tag1'] }),
            CreateCard('Card B', { tags: ['Tag1'] }),
            CreateCard('Card C', { tags: ['Tag3'] }),
        ];

        expect(evaluateCondition(orCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
        // expect(orCondition.successes).toBe(1);
    });
});

describe('Complex nested conditions', () => {
    let testCards: Card[];
    let testDeck: Card[];
    let mockGameState: jest.Mocked<GameState>;
    let mockDeck: jest.Mocked<Deck>;

    beforeEach(() => {
        mockDeck = new Deck([]) as jest.Mocked<Deck>;
        mockGameState = new GameState(mockDeck) as jest.Mocked<GameState>;
        testCards = [];
        testDeck = [...Array(40 - testCards.length)].map(i => CreateCard(`Deck Card ${i}`, {}));

        // Mock GameState properties and methods
        mockGameState.deepCopy = jest.fn().mockReturnValue(mockGameState);
        
        // Mock the hand getter
        Object.defineProperty(mockGameState, 'hand', {
            get: jest.fn().mockImplementation(() => { return testCards; })
        });

        Object.defineProperty(mockDeck, 'deckList', {
            get: jest.fn().mockImplementation(() => { return testDeck; })
        });
    });
    
    describe('Grob Tests', () => {

        test('OR with AND', () => {
            // Tag1
            // Tag1, Tag2
            // Tag3
            // Tag3, Tag2
            // Tag1
    
            // (2+ Tag1 OR Tag2) AND 2+ Tag3
            const condition1: CardCondition = {
                kind: 'card',
                cardName: 'Tag1', 
                cardCount: 2, 
                operator: ConditionOperator.AT_LEAST,
                location: ConditionLocation.HAND,
            };
            const condition2: CardCondition = {
                kind: 'card',
                cardName: 'Tag2', 
                cardCount: 1, 
                operator: ConditionOperator.AT_LEAST,
                location: ConditionLocation.HAND,
            };
            const condition3: CardCondition = {
                kind: 'card',
                cardName: 'Tag3', 
                cardCount: 2, 
                operator: ConditionOperator.AT_LEAST,
                location: ConditionLocation.HAND,
            };
            const nestedOr: LogicCondition = {
                kind: 'logic',
                type: ConditionType.OR,
                conditionA: condition1,
                conditionB: condition2,
                render: {
                    hasParentheses: false,
                }
            };
            const complexCondition: LogicCondition = {
                kind: 'logic',
                type: ConditionType.AND,
                conditionA: nestedOr,
                conditionB: condition3,
                render: {
                    hasParentheses: false,
                }
            };
    
            testCards = [
                CreateCard('Card A', { tags: ['Tag1'] }),
                CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
                CreateCard('Card C', { tags: ['Tag3'] }),
                CreateCard('Card D', { tags: ['Tag3', 'Tag2'] }),
                CreateCard('Card E', { tags: ['Tag1'] }),
            ];
    
            expect(evaluateCondition(complexCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
            // expect(complexCondition.successes).toBe(1);
        });

        test('OR with AND', () => {
            // Tag1
            // Tag1, Tag2
            // Tag3
            // Tag3, Tag2
            // Tag1
    
            // (2+ Tag1 AND Tag2) AND 2+ Tag3
            const condition1: CardCondition = 
            {
                kind: 'card',
                cardName: 'Tag1', 
                cardCount: 2, 
                operator: ConditionOperator.AT_LEAST,
                location: ConditionLocation.HAND,    
            };
            const condition2: CardCondition = 
            {
                kind: 'card',
                cardName: 'Tag2', 
                cardCount: 1, 
                operator: ConditionOperator.AT_LEAST,
                location: ConditionLocation.HAND,    
            };
            const condition3: CardCondition = 
            {
                kind: 'card',
                cardName: 'Tag3', 
                cardCount: 2, 
                operator: ConditionOperator.AT_LEAST,
                location: ConditionLocation.HAND,    
            };
            const nestedAnd: LogicCondition = {
                kind: 'logic',
                type: ConditionType.AND,
                conditionA: condition1,
                conditionB: condition2,
                render: {
                    hasParentheses: false,
                }
            }
            const complexCondition: LogicCondition = {
                kind: 'logic',
                type: ConditionType.AND,
                conditionA: nestedAnd,
                conditionB: condition3,
                render: {
                    hasParentheses: false,
                }
            };
    
            testCards = [
                CreateCard('Card A', { tags: ['Tag1'] }),
                CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
                CreateCard('Card C', { tags: ['Tag3'] }),
                CreateCard('Card D', { tags: ['Tag3', 'Tag2'] }),
                CreateCard('Card E', { tags: ['Tag1'] }),
            ];
    
            expect(evaluateCondition(complexCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(true);
            // expect(complexCondition.successes).toBe(1);
        });

        test('OR with AND', () => {
            // Tag1
            // Tag1, Tag2
            // Tag3
            // Tag3, Tag2
            // Tag1
    
            // (2+ Tag1 AND 2 Tag2) AND 2+ Tag3
            const condition1: CardCondition = {
                kind: 'card',
                cardName: 'Tag1', 
                cardCount: 2, 
                operator: ConditionOperator.AT_LEAST,
                location: ConditionLocation.HAND,
            };
            const condition2: CardCondition = {
                kind: 'card',
                cardName: 'Tag2', 
                cardCount: 2, 
                operator: ConditionOperator.EXACTLY,
                location: ConditionLocation.HAND,
            };
            const condition3: CardCondition = {
                kind: 'card',
                cardName: 'Tag3', 
                cardCount: 2,
                operator: ConditionOperator.AT_LEAST,
                location: ConditionLocation.HAND
            };
            const nestedAnd: LogicCondition = {
                kind: 'logic',
                type: ConditionType.AND,
                conditionA: condition1,
                conditionB: condition2,
                render: {
                    hasParentheses: false,
                }
            }
            const complexCondition: LogicCondition = {
                kind: 'logic',
                type: ConditionType.AND,
                conditionA: nestedAnd,
                conditionB: condition3,
                render: {
                    hasParentheses: false,
                }
            };

            testCards = [
                CreateCard('Card A', { tags: ['Tag1'] }),
                CreateCard('Card B', { tags: ['Tag1', 'Tag2'] }),
                CreateCard('Card C', { tags: ['Tag3'] }),
                CreateCard('Card D', { tags: ['Tag3', 'Tag2'] }),
                CreateCard('Card E', { tags: ['Tag1'] }),
            ];
    
            expect(evaluateCondition(complexCondition, mockGameState.hand, mockGameState.deck.deckList)).toBe(false);
            // expect(complexCondition.successes).toBe(0);
        });
    });
});

describe('cardsThatSatisfy', () => {
    let testCards: Card[];

    beforeEach(() => {
        testCards = [
            CreateCard('Card A', { tags: ['Tag1', 'Tag3'] }),
            CreateCard('Card B', { tags: ['Tag2'] }),
            CreateCard('Card C', { tags: ['Tag1', 'Tag2'] }),
            CreateCard('Card D', { tags: ['Tag3'] }),
        ];
    });

    it('should correctly identify cards for a simple condition', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,
        };
        const result = cardsThatSatisfy(condition, testCards);

        expect(result.size).toBe(1);
        expect(result.get(condition)?.length).toBe(2);
        expect(result.get(condition)?.map(card => card.name)).toEqual(['Card A', 'Card C']);
    });

    it('should handle conditions based on card names', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'Card B',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND,
        };
        const result = cardsThatSatisfy(condition, testCards);

        expect(result.size).toBe(1);
        expect(result.get(condition)?.length).toBe(1);
        expect(result.get(condition)?.[0].name).toBe('Card B');
    });

    it('should correctly process AND conditions', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND
        };
        const andCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.AND,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        const result = cardsThatSatisfy(andCondition, testCards);

        expect(result.size).toBe(2);
        expect(result.get(condition1)?.length).toBe(2);
        expect(result.get(condition2)?.length).toBe(2);
        expect(result.get(condition1)?.map(card => card.name)).toEqual(['Card A', 'Card C']);
        expect(result.get(condition2)?.map(card => card.name)).toEqual(['Card B', 'Card C']);
    });

    it('should correctly process OR conditions', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag3',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND
        };
        const orCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.OR,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };

        const result = cardsThatSatisfy(orCondition, testCards);

        expect(result.size).toBe(2);
        expect(result.get(condition1)?.length).toBe(2);
        expect(result.get(condition2)?.length).toBe(2);
        expect(result.get(condition1)?.map(card => card.name)).toEqual(['Card A', 'Card C']);
        expect(result.get(condition2)?.map(card => card.name)).toEqual(['Card A', 'Card D']);
    });

    it('should handle nested conditions', () => {
        const condition1: CardCondition = {
            kind: 'card',
            cardName: 'Tag1',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND
        };
        const condition2: CardCondition = {
            kind: 'card',
            cardName: 'Tag2',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND
        };
        const condition3: CardCondition = {
            kind: 'card',
            cardName: 'Tag3',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND
        };
        const nestedAnd: LogicCondition = {
            kind: 'logic',
            type: ConditionType.AND,
            conditionA: condition1,
            conditionB: condition2,
            render: {
                hasParentheses: false,
            }
        };
        const complexCondition: LogicCondition = {
            kind: 'logic',
            type: ConditionType.OR,
            conditionA: nestedAnd,
            conditionB: condition3,
            render: {
                hasParentheses: false,
            }
        };

        const result = cardsThatSatisfy(complexCondition, testCards);

        expect(result.size).toBe(3);
        expect(result.get(condition1)?.length).toBe(2);
        expect(result.get(condition2)?.length).toBe(2);
        expect(result.get(condition3)?.length).toBe(2);
        expect(result.get(condition1)?.map(card => card.name)).toEqual(['Card A', 'Card C']);
        expect(result.get(condition2)?.map(card => card.name)).toEqual(['Card B', 'Card C']);
        expect(result.get(condition3)?.map(card => card.name)).toEqual(['Card A', 'Card D']);
    });

    it('should return an empty map for conditions with no matching cards', () => {
        const condition: CardCondition = {
            kind: 'card',
            cardName: 'NonExistent Tag',
            cardCount: 1,
            operator: ConditionOperator.AT_LEAST,
            location: ConditionLocation.HAND
        };
        const result = cardsThatSatisfy(condition, testCards);

        expect(result.size).toBe(1);
        expect(result.get(condition)?.length).toBe(0);
    });
});
