import React from 'react';

// CalculateBlock
class ScoreMapBlock extends CalculateBlock {
    inputType: string | any = null;
    matchOption: number = 0; // 0: 일치, 1: 범위
    outputType: string | any = null;
    data: Array<Array<string>> = new Array<Array<string>>(2);

    constructor(type: BlockType = BlockType.SCORE_MAP) {
        super(type, BlockCalculationTarget.SUBJECT);
    }
    execute(): void {}
    renderCell() {
        return (
            <div>
                <div>ScoreMapBlock</div>
            </div>
        )
    }
}

class FormulaBlock extends CalculateBlock {
    constructor(type: BlockType = BlockType.FORMULA) {
        super(type, BlockCalculationTarget.SUBJECT);
    }
    execute(): void {}
}

class AggregateBlock extends CalculateBlock {
    constructor(type: BlockType = BlockType.AGGREGATE) {
        super(type, BlockCalculationTarget.SUBJECT);
    }
    execute(): void {}
}

class GradeRatioBlock extends CalculateBlock {
    constructor(type: BlockType = BlockType.GRADE_RATIO) {
        super(type, BlockCalculationTarget.SUBJECT);
    }
    execute(): void {}
}

class SubjectGroupRatioBlock extends CalculateBlock {
    constructor(type: BlockType = BlockType.SUBJECT_GROUP_RATIO) {
        super(type, BlockCalculationTarget.SUBJECT);
    }
    execute(): void {}
}

class SeparationRatioBlock extends CalculateBlock {
    constructor(type: BlockType = BlockType.SEPARATION_RATIO) {
        super(type, BlockCalculationTarget.SUBJECT);
    }
    execute(): void {}
}

class FloatFixBlock extends CalculateBlock {
    constructor(type: BlockType = BlockType.FLOAT_FIX) {
        super(type, BlockCalculationTarget.SUBJECT);
    }
    execute(): void {}
}