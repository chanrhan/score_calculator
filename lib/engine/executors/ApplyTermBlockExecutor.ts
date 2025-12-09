import { CalculationLog, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { BLOCK_TYPE } from "@/types/block-types";
import { CalculationLogManager } from "./CalculationLogManager";

export class ApplyTermBlockExecutor extends BlockExecutor {
    public override readonly type : number = BLOCK_TYPE.APPLY_TERM;
    public override readonly name : string = "TermFilter";
    private termsString : string;
    private topTerms : number;

    constructor(blockId: number, caseIndex: number, headerData: any, bodyData: any) {
        super(blockId, caseIndex);
        const terms = bodyData?.terms || '';
        this.termsString = Array.isArray(terms) ? terms.join('|') : terms;
        // use_top_count가 true일 때만 top_count 사용
        const useTopCount = bodyData?.use_top_count || false;
        this.topTerms = useTopCount ? (bodyData?.top_count || 0) : 0;
    }

    public override execute(ctx: Context, subjects: Subject[]) : { ctx: Context, subjects: Subject[] } {
        const logManager = new CalculationLogManager();

        const terms = this.termsString.split('|');
        subjects.forEach(subject => {
        if(!terms.includes(`${subject.grade}-${subject.term}`)){
            subject.filtered_block_id = this.blockId;
            logManager.addLog(subject.seqNumber, {
            input_key: null,
            input: `${subject.grade}-${subject.term}`,
            output_key: null,
            output: "제외",
            });
        }
        });

        if(this.topTerms > 0) {
        let index = 0;
        subjects.filter(subject => subject.score != null)
        .sort((a, b) => (b.score as number) - (a.score as number))
        .forEach((subject) => {
            if(subject.filtered_block_id > 0){
            return;
            }
            if(index >= this.topTerms){
            subject.filtered_block_id = this.blockId;
            logManager.addLog(subject.seqNumber, {
                input_key: null,
                input: `학기별 상위 (${index+1}/${this.topTerms})등`,
                output_key: null,
                output: "제외",
            });
            }
            index++;
        });
        }

        logManager.saveToSnapshot(subjects, this.blockId, this.caseIndex, this.type);
       
        return { ctx, subjects };
    }
}