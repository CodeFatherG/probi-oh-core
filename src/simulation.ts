import { Condition } from "@probi-oh/types";
import { FreeCard } from "./card";
import { freeCardIsUsable, processFreeCard } from "./free-card-processor";
import { GameState } from "./game-state";
import { evaluateCondition, EvaluationResult } from "./condition";

export class SimulationBranch {
    private readonly _gameState: GameState;
    private _result: EvaluationResult;

    constructor(gameState: GameState, readonly _condition: Condition) {
        this._gameState = gameState.deepCopy();
        this._result = {
            success: false,
            successfulConditions: [],
        };
    }

    run(): void {
        this._result = evaluateCondition(this._condition, this._gameState.hand, this._gameState.deck.deckList);
    }

    get result(): boolean {
        return this._result.success; 
    }

    get successfulConditions(): Condition[] {
        return this._result.successfulConditions;
    }

    get condition(): Readonly<Condition> {
        return this._condition;
    }

    get gameState(): GameState {
        return this._gameState;
    }

}

/** Represents a single simulation run */
export class Simulation {
    private readonly _gameState: GameState;
    private _branches: Map<Condition, SimulationBranch[]> = new Map();

    /**
     * Creates a new Simulation
     * @param gameState - The initial game state
     * @param _condition - The condition to evaluate
     */
    public constructor(gameState: GameState, readonly _conditions: Condition[]) {
        this._gameState = gameState.deepCopy();
    }

    private runBranch(branch: SimulationBranch): void {
        branch.run();
        
        if (!this._branches.has(branch.condition)) {
            this._branches.set(branch.condition, []);
        }

        const branches = this._branches.get(branch.condition) || [];
        branches.push(branch);
    }

    /** Runs the simulation, evaluating the condition against the game state */
    iterate(): void {
        this._conditions.forEach(condition => {
           // Run a branch with the original game state
            const branch = new SimulationBranch(this._gameState, condition);
            this.runBranch(branch);
            if (this.result) return;    // return if branch succeeds, we won.

            // The gamestate doesn't work, so we need to try all possible branches
            this.generateFreeCardPermutations(this._gameState, condition); 
        });
    }

    private generateFreeCardPermutations(gameState: GameState, condition: Condition, usedCards: FreeCard[] = []): void {
        const freeCards = gameState.freeCardsInHand.filter(card => 
            freeCardIsUsable(gameState, card) && !usedCards.includes(card)
        );

        if (freeCards.length === 0) {
            return;
        }

        for (const freeCard of freeCards) {
            if (!freeCardIsUsable(gameState, freeCard)) {
                continue;
            }

            // Create a new branch with the updated game state
            const newGameState = gameState.deepCopy();
            const branch = new SimulationBranch(newGameState, condition);
            processFreeCard(branch, freeCard);
            this.runBranch(branch);

            if (this.result) return;  // If we've found a winning combination, stop searching

            // Recursively generate permutations with the remaining free cards
            this.generateFreeCardPermutations(branch.gameState, condition, [...usedCards, freeCard]);
        }
    }

    /** Gets the result of the simulation */
    public get result(): boolean {
        return this.successfulBranches.some(([, branch]) => branch !== undefined);
    }

    /** Gets the conditions being evaluated */
    public get conditions(): Condition[] {
        return this._conditions;
    }

    /** Gets the game state used in the simulation */
    public get gameState(): GameState {
        return this._gameState;
    }

    /** Gets the branches of the simulation */
    public get branches(): Map<Condition, SimulationBranch[]> {
        return this._branches;
    }

    /** Get the branch that succeeded */
    public get successfulBranches(): [Condition, SimulationBranch | undefined][] {
        return Array.from(this._branches).map(([condition, branches]) => [condition, branches.find(branch => branch.result)]) as [Condition, SimulationBranch | undefined][];
    }

    /** Get the branches that failed */
    public get failedBranches(): [Condition, SimulationBranch[]][] {
        return Array.from(this._branches).map(([condition, branches]) => [condition, branches.filter(branch => !branch.result)]) as [Condition, SimulationBranch[]][];
    }

    public conditionSuccesses(condition: Condition): Map<Condition, number> {
        const successfulConditions = new Map<Condition, number>();
        this.branches.get(condition)?.forEach(branch => {
            const conditionsThatSucceeded = branch.successfulConditions;
            conditionsThatSucceeded.forEach(cond => {
                successfulConditions.set(cond, (successfulConditions.get(cond) || 0) + 1);
            });
        });

        return successfulConditions;
    }
}

export function runSimulation(gameState: GameState, conditions: Condition[]): Simulation {
    const simulation = new Simulation(gameState, conditions);
    simulation.iterate();
    return simulation;
}
