import { AndCondition, Condition, OrCondition } from "../../src/condition";
import { GameState } from "../../src/game-state";
import { SimulationBranch } from "../../src/simulation";

export class MockSimulationBranch extends SimulationBranch {
    constructor(
        gameState: GameState,
        condition: Condition | AndCondition | OrCondition
    ) { super(gameState, condition); }
    run(): void {
        throw new Error("Method not implemented.");
    }
    get result(): boolean {
        throw new Error("Method not implemented.");
    }
}