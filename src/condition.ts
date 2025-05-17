import { Card } from './card';
import { CardCondition, Condition, ConditionLocation, ConditionOperator, ConditionType, LogicCondition } from '@probi-oh/types';

export function matchCards(search: string[], cardList: Card[]): Card[] {
    return cardList.filter(card => 
        search.some(s => s == card.name || (card.tags && card.tags.includes(s)))
    );
}

function conditionIsLogical(condition: Condition): condition is LogicCondition {
    return condition.kind === 'logic';
}

function conditionHasAnd(condition: LogicCondition): boolean {
    return condition.type === ConditionType.AND;
}

function generateHandPermutations(hand: Card[]): Card[][] {
    function permute(arr: Card[], start: number = 0): Card[][] {
        if (start === arr.length - 1) {
            return [arr.slice()];
        }

        const permutations: Card[][] = [];

        for (let i = start; i < arr.length; i++) {
            [arr[start], arr[i]] = [arr[i], arr[start]]; // Swap elements
            permutations.push(...permute(arr, start + 1));
            [arr[start], arr[i]] = [arr[i], arr[start]]; // Swap back
        }

        return permutations;
    }

    return permute(hand);
}

interface Result {
    success: boolean;
    usedCards: Card[];
    succeededConditions: Condition[];
}

function evaluateSimpleCondition(condition: CardCondition, 
                                 hand: Card[], 
                                 deck: Card[]): Result {
    /** Evaluates the condition against a hand of cards */
    function evaluate(): Result {
        let cardList: Card[] = [];
        switch (condition.location) {
            case ConditionLocation.DECK:
                cardList = deck
                break;
            default:
                console.error(`Unknown location: ${condition.location}`);
                // Fallthrough to Hand case
            case ConditionLocation.HAND:
                cardList = hand;
                break;
        }

        const count = matchCards([condition.cardName], cardList).length;

        let result = false;
        let usedCards: Card[] = [];
        switch(condition.operator) {
            case ConditionOperator.AT_LEAST:
                result = count >= condition.cardCount;
                usedCards = matchCards([condition.cardName], cardList).slice(0, condition.cardCount);
                break;

            case ConditionOperator.EXACTLY: 
                result = count === condition.cardCount; 
                usedCards = matchCards([condition.cardName], cardList).slice(0, condition.cardCount);
                break;

            case ConditionOperator.NO_MORE: 
                result = count <= condition.cardCount; 
                break;

            default: throw new Error(`Unknown operator: ${condition.operator}`);
        }

        return {
            success: result,
            usedCards: usedCards,
            succeededConditions: result ? [condition] : []
        };
    }

    return evaluate();
}

function evaluateAndCondition(condition: LogicCondition, 
                              hand: Card[], 
                              deck: Card[]): Result {
    function evaluate(): Result {
        // init as a pass
        const result: Result = { success: true, usedCards: [], succeededConditions: [] };

        const evaluate = (condition : Condition, hand : Card[], deck : Card[]): Result  =>{
            const ret = checkCondition(condition, hand, deck);
            if (!ret.success) {
                // then if any result fails consider the overall failure (.every)
                result.success = false;
            } else {
                result.usedCards.push(...ret.usedCards);
                result.succeededConditions.push(...ret.succeededConditions, condition);
            }

            return ret;
        }

        evaluate(condition.conditionA, hand.filter(c => !result.usedCards.includes(c)), deck);
        evaluate(condition.conditionB, hand.filter(c => !result.usedCards.includes(c)), deck);

        if (result.success) {
            result.succeededConditions.push(condition);
        }
        
        return result;
    }

    return evaluate();
}

function evaluateOrCondition(condition: LogicCondition, 
                             hand: Card[], 
                             deck: Card[]): Result {
    function evaluate(): Result {
        // init as a fail
        const result: Result = { success: false, usedCards: [], succeededConditions: [] };
        if (checkCondition(condition.conditionA, hand, deck).success) {
            result.success = true;
            result.succeededConditions.push(condition.conditionA);
        }
        if (checkCondition(condition.conditionB, hand, deck).success) {
            result.success = true;
            result.succeededConditions.push(condition.conditionB);
        }

        if (result.success) {
            result.succeededConditions.push(condition);
        }

        return result;
    }

    return evaluate();
}

export type EvaluationResult = {
    success: boolean;
    successfulConditions: Condition[];
}

function checkCondition(condition: Condition, hand: Card[], deck: Card[]): Result {
    let result;
    
    if (conditionIsLogical(condition)) {
        switch (condition.type) {
            case ConditionType.AND:
                result = evaluateAndCondition(condition, hand, deck);
                break;
            case ConditionType.OR:
                result = evaluateOrCondition(condition, hand, deck);
                break;
            default:
                throw new Error(`Unknown condition type: ${condition.type}`);
        }
    } else {
        result = evaluateSimpleCondition(condition, hand, deck);
    }

    return result;
}

export function evaluateCondition(condition: Condition, hand: Card[], deck: Card[]): EvaluationResult {
    let succeededConditionList: Condition[] = [];
    let result: Result = { success: false, usedCards: [], succeededConditions: [] };

    if (conditionIsLogical(condition) && conditionHasAnd(condition)) {
        const permutations = generateHandPermutations(hand);

        for (const hand of permutations) {
            const succeededConditions: Condition[] = [];
            result = checkCondition(condition, hand, deck);
            
            if (succeededConditions.length > succeededConditionList.length) {
                succeededConditionList = succeededConditions;
            }

            if (result.success) {
                break;
            }
        }
    } else {
        result = checkCondition(condition, hand, deck);
    }

    return {
        success: result.success,
        successfulConditions: Array.from(new Set(result.succeededConditions))
    };
}

/**
 * @brief Returns a map conditions and the cards in the list that satisfy them. Only type Condition is returned as a key
 *        as realistically the only conditions that matter are the end conditions. This is a design choice since and implies that 
 * @note This function is recursive.
 * @param condition 
 * @param list 
 * @returns 
 */
export function cardsThatSatisfy(condition: Condition, list: Card[]): Map<Condition, Card[]> {
    const map = new Map<Condition, Card[]>();

    const iterateCondition = (condition: Condition): void => {
        if (conditionIsLogical(condition)) {
            iterateCondition(condition.conditionA);
            iterateCondition(condition.conditionB);
        } else {
            
            map.set(condition, matchCards([condition.cardName], list));
        }
    }

    iterateCondition(condition);
    return map;
}

export function conditionToString(condition: Condition): string {
    if (conditionIsLogical(condition)) {
        const s = `${conditionToString(condition.conditionA)} ${condition.type.toUpperCase()} ${conditionToString(condition.conditionB)}`;
        return condition.render?.hasParentheses ? `(${s})` : s;
    } else {
         return `${condition.cardCount}${condition.operator} ${condition.cardName} IN ${condition.location.toUpperCase()}`;
    }
}
