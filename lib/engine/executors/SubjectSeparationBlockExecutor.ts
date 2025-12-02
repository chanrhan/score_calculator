import { BlockExecutor } from "./BlockExecutor";
import { CalculationLog, Context, Subject } from "@/types/domain";
import { BLOCK_TYPE } from "@/types/block-types";

export class SubjectSeparationBlockExecutor extends BlockExecutor {

    public override readonly type: number = BLOCK_TYPE.SEPARATION_RATIO;
    public override readonly name: string = "SubjectSeparation";

    private subjectSeparationCodes: Array<Array<string>>;
    private ratios: Array<number>;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        const headers: Array<any> = headerRowCells[0] || [];
        this.subjectSeparationCodes = headers.map(item => item || []);
        const bodies: Array<any> = bodyRowCells[0] || [];
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
            for (let i = 0; i < this.subjectSeparationCodes.length; i++) {
                if (subject.subjectSeparationCode == this.subjectSeparationCodes[i]?.[0]) {
                    let prevScore = subject.score;
                    subject.score = subject.score * ((this.ratios[i] || 0) / 100);
                    if (!map.has(subject.seqNumber)) {
                        map.set(subject.seqNumber, []);
                    }
                    map.get(subject.seqNumber)!.push({
                        input_key: 'score',
                        input: prevScore,
                        output_key: 'score',
                        output: subject.score,
                    });
                }
            }
        });

        map.forEach((logs, seqNumber) => {
            subjects.find(subject => subject.seqNumber === seqNumber)?.snapshot.push({
                block_id: this.blockId,
                case_index: this.caseIndex,
                block_type: 7,
                logs: logs
            });
        });

        return { ctx, subjects };
    }
}