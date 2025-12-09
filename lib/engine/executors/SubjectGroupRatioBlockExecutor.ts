import { CalculationLog, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { BLOCK_TYPE } from "@/types/block-types";
import { CalculationLogManager } from "./CalculationLogManager";

export class SubjectGroupRatioBlockExecutor extends BlockExecutor {
    public override readonly type: number = BLOCK_TYPE.SUBJECT_GROUP_RATIO;
    public override readonly name: string = "SubjectGroupRatio";

    private groups: Array<Array<string>>;
    private ratios: Array<number>;

    constructor(blockId: number, caseIndex: number, headerData: any, bodyData: any) {
        super(blockId, caseIndex);
        // headerData와 bodyData는 배열 형식 [{ subject_groups: string[] }], [{ ratio: number }]
        const headers: Array<any> = Array.isArray(headerData) ? headerData : [];
        this.groups = headers.map(item => item?.subject_groups || item || []);
        const bodies: Array<any> = Array.isArray(bodyData) ? bodyData : [];
        this.ratios = bodies.map(item => item?.ratio || 0);
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        const logManager = new CalculationLogManager();

        subjects.forEach(subject => {
            if (subject.filtered_block_id > 0) {
                return;
            }
            if (subject.score == null) {
                return;
            }
            for (let i = 0; i < this.groups.length; i++) {
                const subjectGroup: Array<string> = this.groups[i] || [];

                if (subjectGroup.includes(subject.organizationCode)) {
                    let prevScore = subject.score;
                    subject.score = subject.score * ((this.ratios[i] || 0) / 100);
                    logManager.addLog(subject.seqNumber, {
                        input_key: 'score',
                        input: prevScore,
                        output_key: 'score',
                        output: subject.score,
                    });
                }
            }
        });

        logManager.saveToSnapshot(subjects, this.blockId, this.caseIndex, 6);

        return { ctx, subjects };
    }
}