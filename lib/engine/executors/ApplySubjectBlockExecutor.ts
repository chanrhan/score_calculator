import { BlockExecutor } from "./BlockExecutor";
import { CalculationLog, Context, Subject } from "@/types/domain";
import { BLOCK_TYPE } from "@/types/block-types";

export class ApplySubjectBlockExecutor extends BlockExecutor {
    public override readonly type : number = BLOCK_TYPE.APPLY_SUBJECT;
    public override readonly name : string = "ApplySubject";
    private includeMode : boolean;
    private applySubjectsParams : Array<string>;
    private isAllSubject : boolean;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.includeMode = Number(headerRowCells[0]?.[0]) == 0;
        this.applySubjectsParams = bodyRowCells[0]?.[0] || [];
        this.isAllSubject = this.applySubjectsParams.includes("*");
    }

    public override execute(ctx: Context, subjects: Subject[]) : { ctx: Context, subjects: Subject[] } {
        if(this.includeMode && this.isAllSubject){
            return { ctx, subjects };
          }
      
          const map : Map<number, CalculationLog[]> = new Map();
      
          subjects.forEach((subject, index) => {
            if(subject.filtered_block_id > 0){
              return;
            }
            const hasSubjectGroup = this.applySubjectsParams.filter(param => param.includes(subject.subjectGroup)).length > 0;
      
            // console.log(`subject: ${subject.subjectGroup}, compared: ${applySubjectsParams}`);
            if(this.includeMode) {  // 포함
              if(this.isAllSubject || !hasSubjectGroup){
                subject.filtered_block_id = this.blockId;
                if(!map.has(subject.seqNumber)){
                  map.set(subject.seqNumber, []);
                }
                map.get(subject.seqNumber)!.push({
                  input_key: null,
                  input: subject.subjectGroup,
                  output_key: null,
                  output: "제외",
                });
              }
            } else {  // 제외
              if(this.isAllSubject || hasSubjectGroup){
                subject.filtered_block_id = this.blockId;
                if(!map.has(subject.seqNumber)){
                  map.set(subject.seqNumber, []);
                }
                map.get(subject.seqNumber)!.push({
                  input_key: null,
                  input: subject.subjectGroup,
                  output_key: null,
                  output: "제외",
                });
              }
            }
          });
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