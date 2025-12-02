import ApplySubjectBlock from './rendered_block/ApplySubjectBlock';
import ApplyTermBlock from './rendered_block/ApplyTermBlock';
import TopSubjectBlock from './rendered_block/TopSubjectBlock';
import DivisionBlock from './rendered_block/DivisionBlock';
import ScoreTableBlock from './rendered_block/ScoreTableBlock';
import FormulaBlock from './rendered_block/FormulaBlock';
import DecimalFixBlock from './rendered_block/DecimalFixBlock';
import AggregationBlock from './rendered_block/AggregationBlock';
import ConditionBlock from './rendered_block/ConditionBlock';
import RatioBlock from './rendered_block/RatioBlock';

interface BlockInfo {
    blockId: number;
    blockInfo: any;
}

const BLOCK_FACTORY : Record<number, (blockInfo: BlockInfo) => React.ReactNode> = {
    1: () => <ApplySubjectBlock />,
    2: () => <ApplyTermBlock />,
    3: () => <TopSubjectBlock />,
    4: () => <DivisionBlock />,
    5: () => <ScoreTableBlock />,
    6: () => <FormulaBlock />,
    7: () => <DecimalFixBlock />,
    8: () => <ConditionBlock />,
    9: () => <AggregationBlock />,
    10: () => <RatioBlock />,
}

export default function useBlockFactory(blockId: number) {
    const blockInfo : BlockInfo = {
        blockId: blockId,
        blockInfo: 1,
    }
    return BLOCK_FACTORY[blockId](blockInfo) ?? <div>Unknown Block {blockId}</div>;
};