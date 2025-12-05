import { calcLog } from "@/lib/utils/calcLogger";
import { BlockExecutor } from "./BlockExecutor";
import { CalculationLog, Context, Subject } from "@/types/domain";
import { BLOCK_TYPE } from "@/types/block-types";
import { CalculationLogManager } from "./CalculationLogManager";

export class AggregationBlockExecutor extends BlockExecutor {
    public override readonly type: number = BLOCK_TYPE.AGGREGATION;
    public override readonly name: string = "Aggregation";

    private inputType: string | null;
    private outputType: string | null;
    private func: number;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.inputType = bodyRowCells[0]?.[0] || null;
        this.outputType = bodyRowCells[0]?.[3] || null;
        this.func = Number(bodyRowCells[0]?.[1]) || 0;
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        const logManager = new CalculationLogManager();
        let scoreSum = 0;
        let result: number = 0;
        if (this.func == 0) { // 이수단위 가중평균
            let unitSum = 0;
            subjects.forEach(subject => {
                if (subject.filtered_block_id > 0) {
                    return;
                }
                const inputValue = subject[this.inputType as keyof Subject]

                let log: CalculationLog = {
                    input_key: this.inputType,
                    input: inputValue,
                    output_key: this.outputType,
                    output: 0,
                };
                if (Number.isNaN(inputValue) || inputValue == null) {
                    log.output_key = null;
                    log.output = "제외";
                    subject.filtered_block_id = this.blockId;
                } else {
                    const score = Number(inputValue) * subject.unit;
                    // subject.score = score;
                    scoreSum += score
                    unitSum += subject.unit || 0
                    log.output = score;
                }
                logManager.addLog(subject.seqNumber, log);
            });

            calcLog(`      🔧 이수단위 가중평균:  ${scoreSum} / ${unitSum} = ${result}`);

            result = unitSum > 0 ? scoreSum / unitSum : 0;
        } else if (this.func == 1) { // 평균 
            let len = 0;
            subjects.filter(subject => subject.filtered_block_id == 0)
                .forEach(subject => {
                    const inputValue = Number(subject[this.inputType as keyof Subject]);
                    let log: CalculationLog = {
                        input_key: this.inputType,
                        input: inputValue,
                        output_key: this.outputType,
                        output: 0,
                    };
                    if (Number.isNaN(inputValue) || inputValue == 0 || inputValue == null) {
                        log.output_key = null;
                        log.output = "제외";
                        subject.filtered_block_id = this.blockId;
                    } else {
                        const score = Number(inputValue) || 0;
                        // subject.score = score;
                        scoreSum += score;
                        log.output = score;
                        len++;
                    }
                    logManager.addLog(subject.seqNumber, log);
                });
            calcLog(`      🔧 평균:  ${scoreSum} / ${len} = ${result}`);

            result = len > 0 ? scoreSum / len : 0;
        }
        else if (this.func == 2) { // 과목 개수
            result = subjects.filter(subject => subject.filtered_block_id == 0).length;
            calcLog('      🔧 과목 개수: ' + result);
        }else if(this.func == 3){ // 합
            subjects.filter(subject => subject.filtered_block_id == 0)
                .forEach(subject => {
                    const inputValue = Number(subject[this.inputType as keyof Subject]);
                    let log: CalculationLog = {
                        input_key: this.inputType,
                        input: inputValue,
                        output_key: this.outputType,
                        output: 0,
                    };
                    if (Number.isNaN(inputValue) || inputValue == 0 || inputValue == null) {
                        log.output_key = null;
                        log.output = "제외";
                        subject.filtered_block_id = this.blockId;
                    } else {
                        const score = Number(inputValue) || 0;
                        scoreSum += score;
                        log.output = score;
                    }
                    logManager.addLog(subject.seqNumber, log);
                });
            calcLog(`      🔧 합:  ${scoreSum}`);
            result = scoreSum;
        }

        this.setContextProperty(ctx, subjects, this.outputType as string, result);

        logManager.saveToSnapshot(subjects, this.blockId, this.caseIndex, 12);

        return { ctx, subjects };
    }

}           