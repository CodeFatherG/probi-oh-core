import { CardCondition, Condition, ConditionLocation, ConditionOperator, ConditionType, LogicCondition } from '@probi-oh/types';
import { parseCondition } from '../src/parser';

describe('parseCondition', () => {
    it('should parse a simple condition', () => {
        const result = parseCondition('Card A');
        expect(result).toHaveProperty('kind', 'card');
        expect((result as CardCondition).cardName).toBe('Card A');
    });

    it('should parse a condition with cardCount', () => {
        const result = parseCondition('2+ Card A');
        expect(result).toHaveProperty('kind', 'card');
        expect((result as CardCondition).cardName).toBe('Card A');
        expect((result as CardCondition).cardCount).toBe(2);
        expect((result as CardCondition).operator).toBe(ConditionOperator.AT_LEAST);
    });

    it('should parse an AND condition', () => {
        const result = parseCondition('Card A AND Card B');
        expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.AND);
    });

    it('should parse an OR condition', () => {
        const result = parseCondition('Card A OR Card B');
        expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.OR);
    });

    it('should parse a complex nested condition', () => {
        const result = parseCondition('(2+ Card A AND Card B) OR (Card C AND 3 Card D)');
        expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.OR);
        expect((result as LogicCondition).conditionA).toHaveProperty('kind', 'logic');
        expect(((result as LogicCondition).conditionA as LogicCondition).type).toBe(ConditionType.AND);
        expect((result as LogicCondition).conditionB).toHaveProperty('kind', 'logic');
        expect(((result as LogicCondition).conditionB as LogicCondition).type).toBe(ConditionType.AND);
    });

    it('should throw an error for invalid input', () => {
        expect(() => parseCondition('Invalid *** Input')).toThrow();
    });

    it('should parse a condition with exact cardCount', () => {
        const result = parseCondition('3 Card A');
        expect(result).toHaveProperty('kind', 'card');
        expect((result as CardCondition).cardName).toBe('Card A');
        expect((result as CardCondition).cardCount).toBe(3);
        expect((result as CardCondition).operator).toBe(ConditionOperator.EXACTLY);
    });

    it('should parse a complex nested condition with multiple AND and OR', () => {
        const result = parseCondition('(2+ Card A AND Card B) OR (Card C AND 3 Card D) AND Card E');
        expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.AND);
        const topLevelAnd = result as LogicCondition;
        expect((topLevelAnd as LogicCondition).conditionA).toHaveProperty('kind', 'logic');
        expect(((topLevelAnd as LogicCondition).conditionA as LogicCondition).type).toBe(ConditionType.OR);
        expect((topLevelAnd as LogicCondition).conditionB).toHaveProperty('kind', 'card');
    });

    it('should throw an error for mismatched parentheses', () => {
        expect(() => parseCondition('(Card A AND Card B')).toThrow();
    });

    it('should parse a condition with a multi-word card name', () => {
        const result = parseCondition('2+ Blue-Eyes White Dragon');
        expect(result).toHaveProperty('kind', 'card');
        expect((result as CardCondition).cardName).toBe('Blue-Eyes White Dragon');
        expect((result as CardCondition).cardCount).toBe(2);
        expect((result as CardCondition).operator).toBe(ConditionOperator.AT_LEAST);
    });
    
    it('should handle whitespace correctly', () => {
        const result = parseCondition('  2+    Card A    AND    Card B  ');
        expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.AND);
        const andCondition = result as LogicCondition;
        expect((andCondition as LogicCondition).conditionA).toHaveProperty('kind', 'card');
        expect((andCondition as LogicCondition).conditionB).toHaveProperty('kind', 'card');
    });
    
    it('should parse nested conditions with multiple levels', () => {
        const result = parseCondition('((Card A OR Card B) AND (Card C OR Card D)) OR Card E');
        expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.OR);
        const orCondition = result as LogicCondition;
        expect((orCondition as LogicCondition).conditionA).toHaveProperty('kind', 'logic');
        expect(((orCondition as LogicCondition).conditionA as LogicCondition).type).toBe(ConditionType.AND);
        expect((orCondition as LogicCondition).conditionB).toHaveProperty('kind', 'card');
    });

    it('should parse a condition with "less than or equal to" cardCount', () => {
        const result = parseCondition('2- Card A');
        expect(result).toHaveProperty('kind', 'card');
        expect((result as CardCondition).cardName).toBe('Card A');
        expect((result as CardCondition).cardCount).toBe(2);
        expect((result as CardCondition).operator).toBe(ConditionOperator.NO_MORE);
    });

    it('should handle unexpected end of input', () => {
        expect(() => parseCondition('Card A AND')).toThrow();
    });

    it('should parse complex nested conditions with mixed operators', () => {
        const result = parseCondition('(Card A OR 2+ Card B) AND (3- Card C OR Card D)');
        expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.AND);
        const andCondition = result as LogicCondition;
        expect((andCondition as LogicCondition).conditionA).toHaveProperty('kind', 'logic');
        expect(((andCondition as LogicCondition).conditionA as LogicCondition).type).toBe(ConditionType.OR);
        expect((andCondition as LogicCondition).conditionB).toHaveProperty('kind', 'logic');
        expect(((andCondition as LogicCondition).conditionB as LogicCondition).type).toBe(ConditionType.OR);
    });

    it('should handle multiple spaces between tokens', () => {
        const result = parseCondition('Card A    AND    2+    Card B');
        expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.AND);
        const andCondition = result as LogicCondition;
        expect((andCondition as LogicCondition).conditionA).toHaveProperty('kind', 'card');
        expect((andCondition as LogicCondition).conditionB).toHaveProperty('kind', 'card');
        expect((andCondition.conditionB as CardCondition).cardCount).toBe(2);
    });

    it('should throw an error for unbalanced parentheses', () => {
        expect(() => parseCondition('(Card A AND Card B')).toThrow();
        expect(() => parseCondition('Card A AND Card B)')).toThrow();
    });

    it('should handle conditions with only parentheses', () => {
        const result = parseCondition('(Card A)');
        expect(result).toHaveProperty('kind', 'card');
        expect((result as CardCondition).cardName).toBe('Card A');
    });

    it('should throw an error for empty parentheses', () => {
        expect(() => parseCondition('()')).toThrow();
    });

    it('should parse a condition with "less than or equal to" cardCount', () => {
        const result = parseCondition('2- Card A');
        expect(result).toHaveProperty('kind', 'card');
        expect((result as CardCondition).cardName).toBe('Card A');
        expect((result as CardCondition).cardCount).toBe(2);
        expect((result as CardCondition).operator).toBe(ConditionOperator.NO_MORE);
    });

    it('should throw an error for invalid cardCount syntax', () => {
        expect(() => parseCondition('2* Card A')).toThrow();
    });

    it('should parse a condition with exact cardCount and no operator', () => {
        const result = parseCondition('3 Card A');
        expect(result).toHaveProperty('kind', 'card');
        expect((result as CardCondition).cardName).toBe('Card A');
        expect((result as CardCondition).cardCount).toBe(3);
        expect((result as CardCondition).operator).toBe(ConditionOperator.EXACTLY);
    });

    it('should throw an error for unexpected end of input after number', () => {
        expect(() => parseCondition('2+')).toThrow();
    });

    it('should throw an error for unexpected token type', () => {
        expect(() => parseCondition('2+ AND Card A')).toThrow();
    });

    it('should handle complex nested conditions with mixed operators and quantities', () => {
        const result = parseCondition('(2+ Card A OR 3- Card B) AND (Card C OR 1 Card D)');
        expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.AND);
        const andCondition = result as LogicCondition;
        expect((andCondition as LogicCondition).conditionA).toHaveProperty('kind', 'logic');
        expect(((andCondition as LogicCondition).conditionA as LogicCondition).type).toBe(ConditionType.OR);
        expect((andCondition as LogicCondition).conditionB).toHaveProperty('kind', 'logic');
        expect(((andCondition as LogicCondition).conditionB as LogicCondition).type).toBe(ConditionType.OR);
    });

    it('should handle card names with numbers', () => {
        const result = parseCondition('Card123');
        expect(result).toHaveProperty('kind', 'card');
        expect((result as CardCondition).cardName).toBe('Card123');
    });

    describe('Location conditions', () => {
        it('should set default location to hand', () => {
            const condition = "Card A";

            const result = parseCondition(condition);
            expect(result).toHaveProperty('kind', 'card');
            expect((result as CardCondition).cardName).toBe("Card A");
            expect((result as CardCondition).location).toBe(ConditionLocation.HAND);
        });

        it('should parse a condition with a hand location', () => {
            const conditions = [
                "Card A IN Hand",
                "Card A IN hand",
                "Card A IN HAND",
                "Card A IN HaNd"
            ];

            conditions.forEach(condition => {
                const result = parseCondition(condition);
                expect(result).toHaveProperty('kind', 'card');
                expect((result as CardCondition).cardName).toBe("Card A");
                expect((result as CardCondition).location).toBe(ConditionLocation.HAND);
            });
        });

        it('should parse a condition with a deck location', () => {
            const conditions = [
                "Card A IN Deck",
                "Card A IN deck",
                "Card A IN DECK",
                "Card A IN deCK"
            ];

            conditions.forEach(condition => {
                const result = parseCondition(condition);
                expect(result).toHaveProperty('kind', 'card');
                expect((result as CardCondition).cardName).toBe("Card A");
                expect((result as CardCondition).location).toBe(ConditionLocation.DECK);
            });
        });

        it('should parse a condition with a location and qty', () => {
            const conditions = [
                {str: "2+ Card A IN Deck",  qty: 2,     op: ConditionOperator.AT_LEAST, loc: ConditionLocation.DECK},
                {str: "2 Card A IN deck",   qty: 2,     op: ConditionOperator.EXACTLY,  loc: ConditionLocation.DECK},
                {str: "3- Card A IN Hand",  qty: 3,     op: ConditionOperator.NO_MORE, loc: ConditionLocation.HAND},
                {str: "1 Card A IN hand",   qty: 1,     op: ConditionOperator.EXACTLY,  loc: ConditionLocation.HAND},
            ];

            conditions.forEach(condition => {
                const result = parseCondition(condition.str);
                expect(result).toHaveProperty('kind', 'card');
                expect((result as CardCondition).cardName).toBe("Card A");
                expect((result as CardCondition).cardCount).toBe(condition.qty);
                expect((result as CardCondition).operator).toBe(condition.op);
                expect((result as CardCondition).location).toBe(condition.loc);
            });
        });

        it('should parse a complex AND condition with a location and qty', () => {
            const condition = "2+ Card A AND 1 Card B IN Hand AND 3 Card C IN Deck";

            const result = parseCondition(condition);
            expect(result).toHaveProperty('kind', 'logic');
            expect((result as LogicCondition).type).toBe(ConditionType.AND);

            const andCondition = result as LogicCondition;

            // Should be [0] = 2+ Card A AND 1 Card B IN Hand, [1] = 3 Card C IN Deck
            expect((andCondition as LogicCondition).conditionA).toHaveProperty('kind', 'logic');
            expect(((andCondition as LogicCondition).conditionA as LogicCondition).type).toBe(ConditionType.AND);
            expect((andCondition as LogicCondition).conditionB).toHaveProperty('kind', 'card');

            const conditionA = andCondition.conditionA as LogicCondition;
            expect(conditionA.conditionA).toHaveProperty('kind', 'card');
            expect(conditionA.conditionB).toHaveProperty('kind', 'card');
            expect((conditionA.conditionA as CardCondition).cardName).toBe("Card A");
            expect((conditionA.conditionA as CardCondition).cardCount).toBe(2);
            expect((conditionA.conditionA as CardCondition).operator).toBe(ConditionOperator.AT_LEAST);
            expect((conditionA.conditionA as CardCondition).location).toBe(ConditionLocation.HAND);
            expect((conditionA.conditionB as CardCondition).cardName).toBe("Card B");
            expect((conditionA.conditionB as CardCondition).cardCount).toBe(1);
            expect((conditionA.conditionB as CardCondition).operator).toBe(ConditionOperator.EXACTLY);
            expect((conditionA.conditionB as CardCondition).location).toBe(ConditionLocation.HAND);

            const conditionB = andCondition.conditionB as CardCondition;
            expect((conditionB).cardName).toBe("Card C");
            expect((conditionB).cardCount).toBe(3);
            expect((conditionB).operator).toBe(ConditionOperator.EXACTLY);
            expect((conditionB).location).toBe(ConditionLocation.DECK);
        });

        it('should parse a complex OR condition with a location and qty', () => {
            const condition = "(2+ Card A OR 1 Card B IN Hand) AND 3 Card C IN Deck";

            const result = parseCondition(condition);
            expect(result).toHaveProperty('kind', 'logic');
            expect((result as LogicCondition).type).toBe(ConditionType.AND);

            const andCondition = result as LogicCondition;

            // Should be [0] = (2+ Card A OR 1 Card B IN Hand), [1] = 3 Card C IN Deck
            expect(andCondition.conditionA).toHaveProperty('kind', 'logic');
            expect((andCondition.conditionA as LogicCondition).type).toBe(ConditionType.OR);
            expect(andCondition.conditionB).toHaveProperty('kind', 'card');

            const conditionA = andCondition.conditionA as LogicCondition;
            expect(conditionA.conditionA).toHaveProperty('kind', 'card');
            expect(conditionA.conditionB).toHaveProperty('kind', 'card');
            expect((conditionA.conditionA as CardCondition).cardName).toBe("Card A");
            expect((conditionA.conditionA as CardCondition).cardCount).toBe(2);
            expect((conditionA.conditionA as CardCondition).operator).toBe(ConditionOperator.AT_LEAST);
            expect((conditionA.conditionA as CardCondition).location).toBe(ConditionLocation.HAND);
            expect((conditionA.conditionB as CardCondition).cardName).toBe("Card B");
            expect((conditionA.conditionB as CardCondition).cardCount).toBe(1);
            expect((conditionA.conditionB as CardCondition).operator).toBe(ConditionOperator.EXACTLY);
            expect((conditionA.conditionB as CardCondition).location).toBe(ConditionLocation.HAND);

            const conditionB = andCondition.conditionB as CardCondition;
            expect((conditionB).cardName).toBe("Card C");
            expect((conditionB).cardCount).toBe(3);
            expect((conditionB).operator).toBe(ConditionOperator.EXACTLY);
            expect((conditionB).location).toBe(ConditionLocation.DECK);
        });
    });

    describe('Edge cases', () => {
        it('should handle card names with numbers', () => {
            const validNames = [
                "Card 1",
                "Card1",
                "C4rd 1"
            ];

            validNames.forEach(name => {
                const result = parseCondition(name);
                    expect(result).toHaveProperty('kind', 'card');
                    expect((result as CardCondition).cardName).toBe(name);
                });
        });

        it('should handle card names starting with number', () => {
            const result = parseCondition("1st Card");
            expect(result).toHaveProperty('kind', 'card');
            expect((result as CardCondition).cardName).toBe("1st Card");
        });

        it('should handle card names starting with number and cardCount', () => {
            const result = parseCondition("2 1st Card");
            expect(result).toHaveProperty('kind', 'card');
            expect((result as CardCondition).cardName).toBe("1st Card");
            expect((result as CardCondition).cardCount).toBe(2);
        });

        it('should handle card names starting with number complex', () => {
            const result = parseCondition("2 1st Card AND 3+ 2nd Card");
            expect(result).toHaveProperty('kind', 'logic');
            expect((result as LogicCondition).type).toBe(ConditionType.AND);
            expect(((result as LogicCondition).conditionA as CardCondition).cardName).toBe("1st Card");
            expect(((result as LogicCondition).conditionA as CardCondition).cardCount).toBe(2);
            expect(((result as LogicCondition).conditionA as CardCondition).operator).toBe(ConditionOperator.EXACTLY);
            expect(((result as LogicCondition).conditionB as CardCondition).cardName).toBe("2nd Card");
            expect(((result as LogicCondition).conditionB as CardCondition).cardCount).toBe(3);
            expect(((result as LogicCondition).conditionB as CardCondition).operator).toBe(ConditionOperator.AT_LEAST);
        });
        
        it('should handle card names with various special characters', () => {
            const validNames = [
            "Pot of Greed",
            "Blue-Eyes White Dragon",
            "Fool's Gold",
            "Goblin, Inc.",
            "Elves & Orcs",
            "Level Up!",
            "Go Fish?",
            "Magic: The Gathering",
            "\"Card Name\"",
            "@Ignister"
            ];
        
            validNames.forEach(name => {
            const result = parseCondition(name);
                expect(result).toHaveProperty('kind', 'card');
                expect((result as CardCondition).cardName).toBe(name);
            });
        });

        it('should reject invalid card names', () => {
            const invalidNames = [
                "No/Slashes",
                "No*Asterisks",
                "No+Plus",
                "No_Underscore",
                "No#Hashtag",
                "No%Percent",
                "No^Caret",
                "No=Equals",
                "No[SquareBrackets]",
                "NoAquareBrackets]",
                "No<Arrows>",
                "NoArrows>",
                "No{Squiglies}",
                "NoSquiglies}",
            ];
        
            invalidNames.forEach(name => {
                expect(() => parseCondition(name)).toThrow();
            });
        });

        it('should handle one parentheses', () => {
            const str = "(Card A OR Card B OR Card C)";
            const result = parseCondition(str);

            expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.OR);

            const parenCond = result as LogicCondition;
            expect(parenCond.render.hasParentheses).toBe(true);
            expect(parenCond.conditionA).toHaveProperty('kind', 'logic');
            expect(parenCond.conditionA).toHaveProperty('type', ConditionType.OR);
            expect(parenCond.conditionB).toHaveProperty('kind', 'card');

            const nestedOr1 = parenCond.conditionA as LogicCondition;
            expect(nestedOr1.render.hasParentheses).toBe(false);
            expect(nestedOr1.conditionA).toHaveProperty('kind', 'card');
            expect(nestedOr1.conditionB).toHaveProperty('kind', 'card');
        });

        it('should handle nested paren', () => {
            const str = "(Card A OR Card B OR (Card C AND Card D))";
            const result = parseCondition(str);

            expect(result).toHaveProperty('kind', 'logic');
        expect((result as LogicCondition).type).toBe(ConditionType.OR);

            const parenCond = result as LogicCondition;
            expect(parenCond.render.hasParentheses).toBe(true);
            expect(parenCond.conditionA).toHaveProperty('kind', 'logic');
            expect(parenCond.conditionA).toHaveProperty('type', ConditionType.OR);
            expect(parenCond.conditionB).toHaveProperty('kind', 'logic');
            expect(parenCond.conditionB).toHaveProperty('type', ConditionType.AND);

            const nestedOr1 = parenCond.conditionA as LogicCondition;
            expect(nestedOr1.render.hasParentheses).toBe(false);
            expect(nestedOr1.conditionA).toHaveProperty('kind', 'card');
            expect(nestedOr1.conditionB).toHaveProperty('kind', 'card');

            const nestedAnd = parenCond.conditionB as LogicCondition;
            expect(nestedAnd.render.hasParentheses).toBe(true);
            expect(nestedAnd.conditionA).toHaveProperty('kind', 'card');
            expect(nestedAnd.conditionB).toHaveProperty('kind', 'card');
        });
    });
});