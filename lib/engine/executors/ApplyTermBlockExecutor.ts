import { CalculationLog, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { BLOCK_TYPE } from "@/types/block-types";

export class ApplyTermBlockExecutor extends BlockExecutor {
    public override readonly type : number = BLOCK_TYPE.APPLY_TERM;
    public override readonly name : string = "TermFilter";
    private termsString : string;
    private topTerms : number;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.termsString = bodyRowCells[0]?.[0] || [];
        this.topTerms = bodyRowCells[0]?.[2] || 0;
    }

    public override execute(ctx: Context, subjects: Subject[]) : { ctx: Context, subjects: Subject[] } {
        const map : Map<number, CalculationLog[]> = new Map();

        const terms = this.termsString.split('|');
        subjects.forEach(subject => {
        if(!terms.includes(`${subject.grade}-${subject.term}`)){
            subject.filtered_block_id = this.blockId;
            if(!map.has(subject.seqNumber)){
            map.set(subject.seqNumber, []);
            }
            map.get(subject.seqNumber)!.push({
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
            if(!map.has(subject.seqNumber)){
                map.set(subject.seqNumber, []);
            }
            map.get(subject.seqNumber)!.push({
                input_key: null,
                input: `학기별 상위 (${index+1}/${this.topTerms})등`,
                output_key: null,
                output: "제외",
            });
            }
            index++;
        });
        }

        

        map.forEach((logs, seqNumber) => {
            subjects.find(subject => subject.seqNumber === seqNumber)?.snapshot.push({
            block_id: this.blockId,
            case_index: this.caseIndex,
            block_type: this.type,
            logs: logs
            });
        });
       
        return { ctx, subjects };
    }
}