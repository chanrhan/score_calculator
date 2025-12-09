import { BlockExecutor } from "./BlockExecutor";
import { CalculationLog, Context, Subject } from "@/types/domain";
import { BLOCK_TYPE } from "@/types/block-types";
import { CalculationLogManager } from "./CalculationLogManager";

export class ApplySubjectBlockExecutor extends BlockExecutor {
    public override readonly type : number = BLOCK_TYPE.APPLY_SUBJECT;
    public override readonly name : string = "ApplySubject";
    private includeMode : boolean;
    private applySubjectsParams : Array<string>;
    private isAllSubject : boolean;

    constructor(blockId: number, caseIndex: number, headerData: any, bodyData: any) {
        super(blockId, caseIndex);
        const includeOption = headerData?.include_option || '0';
        this.includeMode = includeOption === '0';
        this.applySubjectsParams = bodyData?.subject_groups || [];
        this.isAllSubject = this.applySubjectsParams.includes("*");
    }

    public override execute(ctx: Context, subjects: Subject[]) : { ctx: Context, subjects: Subject[] } {
        if(this.includeMode && this.isAllSubject){
            return { ctx, subjects };
          }
      
          const logManager = new CalculationLogManager();
      
          subjects.forEach((subject, index) => {
            if(subject.filtered_block_id > 0){
              return;
            }
            const hasSubjectGroup = this.applySubjectsParams.filter(param => param.includes(subject.subjectGroup)).length > 0;
      
            // console.log(`subject: ${subject.subjectGroup}, compared: ${applySubjectsParams}`);
            if(this.includeMode) {  // 포함
              if(this.isAllSubject || !hasSubjectGroup){
                subject.filtered_block_id = this.blockId;
                logManager.addLog(subject.seqNumber, {
                  input_key: null,
                  input: subject.subjectGroup,
                  output_key: null,
                  output: "제외",
                });
              }
            } else {  // 제외
              if(this.isAllSubject || hasSubjectGroup){
                subject.filtered_block_id = this.blockId;
                logManager.addLog(subject.seqNumber, {
                  input_key: null,
                  input: subject.subjectGroup,
                  output_key: null,
                  output: "제외",
                });
              }
            }
          });
          logManager.saveToSnapshot(subjects, this.blockId, this.caseIndex, this.type);
        
        return { ctx, subjects };
    }
}