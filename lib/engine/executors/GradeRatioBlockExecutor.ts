import { CalculationLog, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { BLOCK_TYPE } from "@/types/block-types";

export class GradeRatioBlockExecutor extends BlockExecutor {
    public override readonly type: number = BLOCK_TYPE.GRADE_RATIO;
    public override readonly name: string = "GradeRatio";

    private grades: Array<number>;
    private ratios : Array<number>;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        const headers: Array<any> = headerRowCells[0] || [];
        this.grades = headers.map(item => item?.[0]);
        const bodies : Array<any> = bodyRowCells[0] || [];
        this.ratios = bodies.map(item => item?.[0] || 0);
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        const map: Map<number, CalculationLog[]> = new Map();

        subjects.forEach(subject => {
            if (subject.filtered_block_id > 0) {
                return;
            }
            if (subject.score == null) {
                return;
            }
            for (let i = 0; i < this.grades.length; i++) {
                if (subject.grade == this.grades[i]) {
                    let prevScore = subject.score;
                    subject.score = subject.score * ((this.ratios[i] || 0) / 100);
                    if (!map.has(subject.seqNumber)) {
                        map.set(subject.seqNumber, []);
                    }
                    map.get(subject.seqNumber)!.push({
                        input_key: 'score',
                        input: prevScore,
                        output_key: 'score',
                        output: subject.score
                    });
                }
            }
        });

        map.forEach((logs, seqNumber) => {
            subjects.find(subject => subject.seqNumber === seqNumber)?.snapshot.push({
                block_id: this.blockId,
                case_index: this.caseIndex,
                block_type: 3,
                logs: logs
            });
        });

        return { ctx, subjects };
    }
}