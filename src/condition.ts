import { Card } from './card';
import { CardCondition, ConditionLocation, ConditionOperator, ConditionType, LogicCondition, SimulationConditionResult } from '@probi-oh/types';

export function matchCards(search: string[], cardList: Card[]): Card[] {
    return cardList.filter(card => 
        search.some(s => s == card.name || (card.tags && card.tags.includes(s)))
    );
}

function conditionIsLogical(condition: CardCondition | LogicCondition): condition is LogicCondition {
    return 'conditionA' in condition && 'conditionB' in condition;
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
            usedCards: usedCards
        };
    }

    return evaluate();
}

function evaluateAndCondition(condition: LogicCondition, 
                              hand: Card[], 
                              deck: Card[],
                              succeededConditions: SimulationConditionResult[]): Result {
    function evaluate(): Result {
        // init as a pass
        const result: Result = { success: true, usedCards: [] };

        const evaluate = (condition : CardCondition, hand : Card[], deck : Card[]): Result  =>{
            const ret = checkCondition(condition, hand, deck, succeededConditions);
            if (!ret.success) {
                // then if any result fails consider the overall failure (.every)
                result.success = false;
            } else {
                result.usedCards.push(...ret.usedCards);
            }

            return ret;
        }

        evaluate(condition.conditionA, hand.filter(c => !result.usedCards.includes(c)), deck);
        evaluate(condition.conditionB, hand.filter(c => !result.usedCards.includes(c)), deck);
        
        return result;
    }

    return evaluate();
}

function evaluateOrCondition(condition: LogicCondition, 
                             hand: Card[], 
                             deck: Card[],
                             succeededConditions: SimulationConditionResult[]): Result {
    function evaluate(): Result {
        // init as a fail
        const result: Result = { success: false, usedCards: [] };
        if (checkCondition(condition.conditionA, hand, deck, succeededConditions).success) {
            result.success = true;
        }
        if (checkCondition(condition.conditionB, hand, deck, succeededConditions).success) {
            result.success = true;
        }
        
        return result;
    }

    return evaluate();
}

function checkCondition(condition: CardCondition | LogicCondition, hand: Card[], deck: Card[], succeededConditions: SimulationConditionResult[]): Result {
    let result;
    
    if (conditionIsLogical(condition)) {
        switch (condition.type) {
            case ConditionType.AND:
                result = evaluateAndCondition(condition, hand, deck, succeededConditions);
                break;
            case ConditionType.OR:
                result = evaluateOrCondition(condition, hand, deck, succeededConditions);
                break;
            default:
                throw new Error(`Unknown condition type: ${condition.type}`);
        }
    } else {
        result = evaluateSimpleCondition(condition, hand, deck);
    }

    if (result.success) {
        succeededConditions.push({
            condition: condition,
            successes: 0
        });
    }

    return result;
}

export function evaluateCondition(condition: CardCondition | LogicCondition, hand: Card[], deck: Card[]): boolean {
    let succeededConditionList: SimulationConditionResult[] = [];
    let result: boolean = false;

    if (conditionIsLogical(condition) && conditionHasAnd(condition)) {
        const permutations = generateHandPermutations(hand);

        for (const hand of permutations) {
            const succeededConditions: SimulationConditionResult[] = [];
            result = checkCondition(condition, hand, deck, succeededConditions).success
            
            if (succeededConditions.length > succeededConditionList.length) {
                succeededConditionList = succeededConditions;
            }

            if (result) {
                break;
            }
        }
    } else {
        result = checkCondition(condition, hand, deck, succeededConditionList).success;
    }

    for (const condition of succeededConditionList) {
        condition.successes++;
    }    

    return result;
}

/**
 * @brief Returns a map conditions and the cards in the list that satisfy them. Only type Condition is returned as a key
 *        as realistically the only conditions that matter are the end conditions. This is a design choice since and implies that 
 * @note This function is recursive.
 * @param condition 
 * @param list 
 * @returns 
 */
export function cardsThatSatisfy(condition: CardCondition | LogicCondition, list: Card[]): Map<CardCondition | LogicCondition, Card[]> {
    const map = new Map<CardCondition | LogicCondition, Card[]>();

    const iterateCondition = (condition: CardCondition | LogicCondition): void => {
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
