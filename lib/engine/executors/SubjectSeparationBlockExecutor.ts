import { BlockExecutor } from "./BlockExecutor";
import { CalculationLog, Context, Subject } from "@/types/domain";
import { BLOCK_TYPE } from "@/types/block-types";
import { CalculationLogManager } from "./CalculationLogManager";

export class SubjectSeparationBlockExecutor extends BlockExecutor {

    public override readonly type: number = BLOCK_TYPE.SEPARATION_RATIO;
    public override readonly name: string = "SubjectSeparation";

    private subjectSeparationCodes: Array<Array<string>>;
    private ratios: Array<number>;

    constructor(blockId: number, caseIndex: number, headerData: any, bodyData: any) {
        super(blockId, caseIndex);
        // headerData와 bodyData는 배열 형식 [{ subject_separations: string[] }], [{ ratio: number }]
        const headers: Array<any> = Array.isArray(headerData) ? headerData : [];
        // subject_separations는 배열이지만 Executor는 첫 번째 요소만 사용하므로 [subject_separations] 형식으로 변환
        this.subjectSeparationCodes = headers.map(item => {
            const separations = item?.subject_separations || item || [];
            return Array.isArray(separations) ? separations : [separations];
        });
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
            for (let i = 0; i < this.subjectSeparationCodes.length; i++) {
                if (subject.subjectSeparationCode == this.subjectSeparationCodes[i]?.[0]) {
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

        logManager.saveToSnapshot(subjects, this.blockId, this.caseIndex, 7);

        return { ctx, subjects };
    }
}