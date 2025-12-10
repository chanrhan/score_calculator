import { CalculationLog, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { BLOCK_TYPE } from "@/types/block-types";
import { CalculationLogManager } from "./CalculationLogManager";

export class ApplyTermBlockExecutor extends BlockExecutor {
    public override readonly type : number = BLOCK_TYPE.APPLY_TERM;
    public override readonly name : string = "TermFilter";
    private enabledTerms : string[];
    private topTerms : number;

    constructor(blockId: number, caseIndex: number, headerData: any, bodyData: any) {
        super(blockId, caseIndex);
        
        // 각 학기별 boolean 속성에서 활성화된 학기 목록 생성
        const enabledTermsList: string[] = [];
        
        // 기존 terms 문자열 형식 지원 (마이그레이션)
        if (bodyData?.terms && typeof bodyData.terms === 'string' && bodyData.terms.trim() !== '') {
            const terms = bodyData.terms.split('|').map((t: string) => t.trim()).filter((t: string) => t !== '');
            enabledTermsList.push(...terms);
        } else {
            // 새로운 boolean 속성 사용
            if (bodyData?.term_1_1) enabledTermsList.push('1-1');
            if (bodyData?.term_1_2) enabledTermsList.push('1-2');
            if (bodyData?.term_2_1) enabledTermsList.push('2-1');
            if (bodyData?.term_2_2) enabledTermsList.push('2-2');
            if (bodyData?.term_3_1) enabledTermsList.push('3-1');
            if (bodyData?.term_3_2) enabledTermsList.push('3-2');
        }
        
        this.enabledTerms = enabledTermsList;
        
        // use_top_count가 true일 때만 top_count 사용
        const useTopCount = bodyData?.use_top_count || false;
        this.topTerms = useTopCount ? (bodyData?.top_count || 0) : 0;
    }

    public override execute(ctx: Context, subjects: Subject[]) : { ctx: Context, subjects: Subject[] } {
        const logManager = new CalculationLogManager();

        subjects.forEach(subject => {
        if(!this.enabledTerms.includes(`${subject.grade}-${subject.term}`)){
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