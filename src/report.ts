import { CardStats, Condition, ConditionStats, SimulationOutput } from "@probi-oh/types";
import { GameState } from "./game-state";
import { Simulation, SimulationBranch } from "./simulation";
import { Card } from "./card";
import { conditionToString } from "./condition";

function countCards(list: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const card of list) {
        const count = counts.get(card) || 0;
        counts.set(card, count + 1);
    }

    return counts;
}

function countCardsInList(store: Record<string, CardStats>, list: string[]): void {
    const cardCounts = countCards(list);
    
    // Process card counts
    for (const [id, count] of cardCounts) {
        if (!store[id]) {
            store[id] = {
                seenCount: {},
                drawnCount: 0,
            };
        }

        store[id].seenCount[count] = (store[id].seenCount[count] || 0) + 1;
    }
}

function processInitialHand(report: SimulationOutput, gameState: GameState): void {
    countCardsInList(report.cardNameStats, gameState.hand.map(card => card.name));
    countCardsInList(report.cardTagStats, gameState.hand.map(card => card.tags ?? []).flat());
}

function processFreeCards(report: SimulationOutput, simulation: Simulation): void {
    const aggregateDrawnCards = (branches: SimulationBranch[]): void =>{
        // Count cards drawn. We can did this by going through each branch and checking if the card is in the last hand
        let lastHand: Card[] = branches[0].gameState.hand;
        branches.slice(1).forEach(b => {
            const drawnCards = b.gameState.hand.filter(card => !lastHand.includes(card));
            lastHand = b.gameState.hand;

            for (const card of drawnCards) {
                // check if card is in the report
                if (!report.cardNameStats[card.name]) {
                    report.cardNameStats[card.name] = {
                        seenCount: {},
                        drawnCount: 0,
                    };
                }

                const cardNameStats = report.cardNameStats[card.name];
                cardNameStats.drawnCount = (cardNameStats.drawnCount || 0) + 1;

                // check if tag is in the report
                for (const tag of card.tags || []) {
                    if (!report.cardTagStats[tag]) {
                        report.cardTagStats[tag] = {
                            seenCount: {},
                            drawnCount: 0,
                        };
                    }

                    const tagStats = report.cardTagStats[tag];
                    tagStats.drawnCount = (tagStats.drawnCount || 0) + 1;
                }
            }
        });
    };

    const aggregateConditionFreeCards = (conditionBranch: SimulationBranch[]): void => {
        const successfulBranch = conditionBranch.find(b => b.result);
        if (successfulBranch) {
            // If there is a successful branch, then the free cards played helped us win
            const usedFreeCards = successfulBranch.gameState.freeCardsPlayedThisTurn;

            // If there are free cards in the successful branch, Then you have won without using them
            const unusedFreeCards = successfulBranch.gameState.freeCardsInHand;

            if (usedFreeCards.length === 0 && unusedFreeCards.length === 0) {
                return;
            }

            report.freeCardStats = report.freeCardStats || {};

            for (const freeCard of usedFreeCards) {
                // check if card is in the report
                if (!report.freeCardStats[freeCard.name]) {
                    report.freeCardStats[freeCard.name] = {
                        conditions: {
                            usedToWinCount: 0,
                            unusedCount: 0,
                        },
                        overall: {
                            usedToWinCount: 0,
                            unusedCount: 0,
                        },
                    };
                }

                const freeCardStats = report.freeCardStats[freeCard.name];
                freeCardStats.conditions.usedToWinCount = (freeCardStats.conditions.usedToWinCount || 0) + 1;
            }

            for (const freeCard of unusedFreeCards) {
                // check if card is in the report
                if (!report.freeCardStats[freeCard.name]) {
                    report.freeCardStats[freeCard.name] = {
                        conditions: {
                            usedToWinCount: 0,
                            unusedCount: 0,
                        },
                        overall: {
                            usedToWinCount: 0,
                            unusedCount: 0,
                        },
                    };
                }

                const freeCardStats = report.freeCardStats[freeCard.name];
                freeCardStats.conditions.unusedCount = (freeCardStats.conditions.unusedCount || 0) + 1;
            }
        }
    };

    const aggregateOverallFreeCards = (sim: Simulation): void => {
        // Get a list of successful branches SimulationBranch[]
        const successfulBranches = sim.successfulBranches.map(([, branch]) => branch);

        // get a unique list of free cards in the successful branches hands (unused)
        const freeCardsInHand = new Set<string>();
        for (const c of successfulBranches.map(b => b?.gameState.freeCardsInHand).flat()) {
            if (c) {
                freeCardsInHand.add(c.name);
            }
        }

        // If there is a free card in the hand, then you have won without using it
        if (freeCardsInHand.size !== 0) {
            for (const freeCard of freeCardsInHand) {
                report.freeCardStats = report.freeCardStats || {};

                // check if card is in the report
                if (!report.freeCardStats[freeCard]) {
                    report.freeCardStats[freeCard] = {
                        conditions: {
                            usedToWinCount: 0,
                            unusedCount: 0,
                        },
                        overall: {
                            usedToWinCount: 0,
                            unusedCount: 0,
                        },
                    };
                }

                const freeCardStats = report.freeCardStats[freeCard];
                freeCardStats.overall.unusedCount = (freeCardStats.overall.unusedCount || 0) + 1;
            }
        } else {
            // If there are no free cards in the hand, then the free cards played helped us win

            // get a unique list of free cards played in the successful branches (used)
            const freeCardsPlayed = new Set<string>();
            for (const c of successfulBranches.map(b => b?.gameState.freeCardsPlayedThisTurn).flat()) {
                if (c) {
                    freeCardsPlayed.add(c.name);
                }
            }

            if (freeCardsPlayed.size !== 0) {
                for (const freeCard of freeCardsPlayed) {
                    report.freeCardStats = report.freeCardStats || {};

                    // check if card is in the report
                    if (!report.freeCardStats[freeCard]) {
                        report.freeCardStats[freeCard] = {
                            conditions: {
                                usedToWinCount: 0,
                                unusedCount: 0,
                            },
                            overall: {
                                usedToWinCount: 0,
                                unusedCount: 0,
                            },
                        };
                    }

                    const freeCardStats = report.freeCardStats[freeCard];
                    freeCardStats.overall.usedToWinCount = (freeCardStats.overall.usedToWinCount || 0) + 1;
                }
            }
        }
    };

    simulation.branches.forEach(conditionBranch => {
        aggregateDrawnCards(conditionBranch);
        aggregateConditionFreeCards(conditionBranch);
    });

    aggregateOverallFreeCards(simulation);
}

function processBanishedCards(report: SimulationOutput, simulation: Simulation): void {
    const cardCounts = new Map<string, number>();

    simulation.successfulBranches.filter(b => b[1]).forEach(branch => {
        const banishPile = branch[1]?.gameState.banishPile || [];

        if (banishPile.length === 0) {
            return;
        }

        report.banishedCardNameStats = report.banishedCardNameStats || {};
        report.banishedCardTagStats = report.banishedCardTagStats || {};

        // Count occurrences of each card
        for (const card of banishPile) {
            const count = cardCounts.get(card.name) || 0;
            cardCounts.set(card.name, count + 1);
        }

        // Process card counts
        for (const [cardName, count] of cardCounts) {
            const card = branch[1]?.gameState.banishPile.find(c => c.name === cardName);
            if (card) {
                // check if card is in the report
                if (!report.banishedCardNameStats[cardName]) {
                    report.banishedCardNameStats[cardName] = {
                        seenCount: {},
                        drawnCount: 0,
                    };
                }

                const cardNameStats = report.banishedCardNameStats[cardName];
                cardNameStats.seenCount[count] = (cardNameStats.seenCount[count] || 0) + 1;

                // check if tag is in the report
                for (const tag of card.tags || []) {
                    if (!report.banishedCardTagStats[tag]) {
                        report.banishedCardTagStats[tag] = {
                            seenCount: {},
                            drawnCount: 0,
                        };
                    }

                    const tagStats = report.banishedCardTagStats[tag];
                    tagStats.seenCount[count] = (tagStats.seenCount[count] || 0) + 1;
                }
            }
        }
    });
}

function processDiscardedCards(report: SimulationOutput, simulation: Simulation): void {
    const cardCounts = new Map<string, number>();

    simulation.successfulBranches.filter(b => b[1]).forEach(branch => {
        const graveyard = branch[1]?.gameState.graveyard || [];

        if (graveyard.length === 0) {
            return;
        }

        report.discardedCardNameStats = report.discardedCardNameStats || {};
        report.discardedCardTagStats = report.discardedCardTagStats || {};

        // Count occurrences of each card
        for (const card of graveyard) {
            const count = cardCounts.get(card.name) || 0;
            cardCounts.set(card.name, count + 1);
        }

        // Process card counts
        for (const [cardName, count] of cardCounts) {
            const card = branch[1]?.gameState.graveyard.find(c => c.name === cardName);
            if (card) {
                // check if card is in the report
                if (!report.discardedCardNameStats[cardName]) {
                    report.discardedCardNameStats[cardName] = {
                        seenCount: {},
                        drawnCount: 0,
                    };
                }

                const cardNameStats = report.discardedCardNameStats[cardName];
                cardNameStats.seenCount[count] = (cardNameStats.seenCount[count] || 0) + 1;

                // check if tag is in the report
                for (const tag of card.tags || []) {
                    if (!report.discardedCardTagStats[tag]) {
                        report.discardedCardTagStats[tag] = {
                            seenCount: {},
                            drawnCount: 0,
                        };
                    }

                    const tagStats = report.discardedCardTagStats[tag];
                    tagStats.seenCount[count] = (tagStats.seenCount[count] || 0) + 1;
                }
            }
        }
    });
}

function processConditionStats(report: SimulationOutput, condition: Condition): void {
    const processCondition = (stats: ConditionStats | undefined, condition: Condition) => {
        if (stats === undefined) {
            console.error(`Condition statistics not found for condition: ${conditionToString(condition)}`);
            return;
        }
        
        if (condition.kind === 'logic') {
            const evaluateCondition = (subCondition: Condition): void => {
                stats.subConditionStats = stats.subConditionStats || {};
                if (stats.subConditionStats[conditionToString(subCondition)] === undefined) {
                    stats.subConditionStats[conditionToString(subCondition)] = {
                        successCount: 0//subCondition.successes,
                    };
                    processCondition(stats.subConditionStats[conditionToString(subCondition)], subCondition);
                }
            }

            evaluateCondition(condition.conditionA);
            evaluateCondition(condition.conditionB);
        }
    };

    console.log(`Processing condition: ${conditionToString(condition)}`);

    report.conditionStats[conditionToString(condition)] = {
        successCount: 0//condition.successes,
    }
    processCondition(report.conditionStats[conditionToString(condition)], condition);

    console.log(report.conditionStats[conditionToString(condition)]);
}

function processSimulations(simulations: Simulation[]): SimulationOutput {
    const report: SimulationOutput = {
        iterations: simulations.length,
        successfulSimulations: simulations.filter(s => s.result).length,
        cardNameStats: {},
        cardTagStats: {},
        conditionStats: {},
    };

    for (const simulation of simulations) {
        // Process the initial hand recording seen counts
        processInitialHand(report, simulation.gameState);

        // Process free card statistics
        processFreeCards(report, simulation);

        // Check game state statistics
        processBanishedCards(report, simulation);
        processDiscardedCards(report, simulation);
    }

    // Process condition statistics. Condition objects are constant so we can use the first simulation
    if (simulations.length > 0) {
        simulations[0].conditions.forEach(condition => processConditionStats(report, condition));
    }

    return report;
}

export function generateReport(simulations: Simulation[]): SimulationOutput {
    return processSimulations(simulations);
}
