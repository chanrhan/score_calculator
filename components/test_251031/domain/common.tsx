
// enum
enum BlockType {
    DIVISION = 1,
    APPLY_SUBJECT = 2,
    GRADE_RATIO = 3,
    APPLY_TERM = 4,
    TOP_SUBJECT = 5,
    SUBJECT_GROUP_RATIO = 6,
    SEPARATION_RATIO = 7,
    SCORE_MAP = 8,
    FORMULA = 9,
    AGGREGATE = 10,
    FLOAT_FIX = 11,
} 

enum BlockCalculationMode {
    CALCULATE = 1,
    FILTER = 2,
}

enum BlockCalculationTarget {
    STUDENT = 1,
    SUBJECT = 2,
    SUBJECT_GROUP = 3,
}

interface CellElement{
    
}

interface TokenElement extends CellElement{
    key: string;
}


interface TokenMenuItem{
    key: string;
    value: string;
}

// interface

// class
class ComponentContainer {
    blocks: Block[] = [];
}

class Cell {
    elements: CellElement[] = [];
}


// class BlockOption {
//     mode: BlockCalculationMode;
//     target: BlockCalculationTarget;
//     constructor(mode: BlockCalculationMode, target: BlockCalculationTarget) {
//         this.mode = mode;
//         this.target = target;
//     }
// }

abstract class Block {
    type: BlockType;
    mode: BlockCalculationMode;
    target: BlockCalculationTarget;
    colCount: number;
    cells: Cell[] = new Array<Cell>(1);

    constructor(type: BlockType, mode: BlockCalculationMode, target: BlockCalculationTarget, colCount: number = 1) {
        this.type = type;
        this.mode = mode;
        this.target = target;
        this.colCount = colCount;
        this.init();
    }

    private init(): void {

    }
    protected getTokenMenu(key: string): TokenMenuItem[] {
        return [];
    }

    public abstract execute(): void;
}

abstract class CalculateBlock extends Block {
    constructor(type: BlockType, target: BlockCalculationTarget) {
        super(type, BlockCalculationMode.CALCULATE, target);
    }
}

abstract class FilterBlock extends Block {
    constructor(type: BlockType, target: BlockCalculationTarget) {
        super(type, BlockCalculationMode.FILTER, target);
    }
}

