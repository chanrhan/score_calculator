
// FilterBlock
class ApplySubjectBlock extends FilterBlock {
    constructor(type: BlockType = BlockType.APPLY_SUBJECT) {
        super(type, BlockCalculationTarget.STUDENT);
    }
    execute(): void {}
}

class ApplyTermBlock extends FilterBlock {
    constructor(type: BlockType = BlockType.APPLY_TERM) {
        super(type, BlockCalculationTarget.STUDENT);
    }
    execute(): void {}
}

class TopSubjectBlock extends FilterBlock {
    constructor(type: BlockType = BlockType.TOP_SUBJECT) {
        super(type, BlockCalculationTarget.STUDENT);
    }
    execute(): void {}
}

class DivisionBlock extends FilterBlock {
    constructor(type: BlockType = BlockType.DIVISION) {
        super(type, BlockCalculationTarget.STUDENT);
    }
    execute(): void {}
}