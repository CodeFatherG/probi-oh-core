import { MockGameState } from './mock/game-state.mock';
import { MockDeck } from './mock/deck.mock';
import { Card, CreateCard } from '../src/card';
import { evaluateCondition } from '../src/condition';
import { parseCondition } from './../src/parser';

describe('testers', () => {
    describe('burnpsy', () => {
        const condition = parseCondition("(1+ A AND 1+ A Garnet IN Deck) OR (1+ B AND 1+ B Garnet IN Deck) AND 1+ Extender");

        it ('should pass for A condition', () => {
            const hand = [CreateCard('A', {}), CreateCard('Extender', {})];
            const deck = [CreateCard('A Garnet', {})];

            const result = evaluateCondition(condition, hand, deck);
            expect(result.success).toBe(true);
            expect(result.successfulConditions).toContain(condition);
        });

        it ('should pass for B condition', () => {
            const hand = [CreateCard('B', {}), CreateCard('Extender', {})];
            const deck = [CreateCard('B Garnet', {})];

            const result = evaluateCondition(condition, hand, deck)
            expect(result.success).toBe(true);
            expect(result.successfulConditions).toContain(condition);
        });

        it ('should fail drawing A Garnet condition', () => {
            const hand: Card[] = [CreateCard('A', {}), CreateCard('Extender', {}), CreateCard('A Garnet', {})];
            const deck: Card[] = [];

            const result = evaluateCondition(condition, hand, deck);
            expect(result.success).toBe(false);
            expect(result.successfulConditions).not.toContain(condition);
        });

        it ('should fail drawing B Garnet condition', () => {
            const hand: Card[] = [CreateCard('B', {}), CreateCard('Extender', {}), CreateCard('B Garnet', {})];
            const deck: Card[] = [];

            const result = evaluateCondition(condition, hand, deck);
            expect(result.success).toBe(false);
            expect(result.successfulConditions).not.toContain(condition);
        });
    });
});