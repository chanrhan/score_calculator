import { CalculationLog, Context, Subject } from "@/types/domain";
import { BlockExecutor } from "./BlockExecutor";
import { calcLog } from "@/lib/utils/calcLogger";
import { isEmpty } from "@/lib/utils/validationUtils";

export class ScoreTableBlockExecutor extends BlockExecutor {
    public override readonly type: number = 8;
    public override readonly name: string = "ScoreTable";

    private filterOption: number;
    private inputType: string;
    private inputRange: number;
    private outputType: string;
    private table: Array<Array<string>>;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.filterOption = headerRowCells[0]?.[1] || 0;
        this.inputType = bodyRowCells[0]?.[0] || null;
        this.inputRange = bodyRowCells[0]?.[1] || -1;
        this.outputType = bodyRowCells[0]?.[2] || null;
        this.table = bodyRowCells[0]?.[4] || null;
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        const map: Map<number, CalculationLog[]> = new Map();
        let inputValue: any = null;
        let log: CalculationLog;
        if(this.getContextProperty(ctx, this.inputType) != null) {
            inputValue = this.getContextProperty(ctx, this.inputType);
            log = {
                input_key: this.inputType,
                input: inputValue,
                output_key: this.outputType,
                output: null
            };
            const {matched, matchedValue} = this.mappingScore(inputValue);
            if(matched) {
                log.output = matchedValue;
                this.setContextProperty(ctx, subjects, this.outputType, matchedValue);
            }
        }else{
            subjects.forEach(subject => {
                inputValue = subject[this.inputType as keyof Subject];
                log = {
                    input_key: this.inputType,
                    input: inputValue,
                    output_key: this.outputType,
                    output: null
                };
                const {matched, matchedValue} = this.mappingScore(inputValue);
                if(matched) {
                    log.output = matchedValue;
                    subject[this.outputType as keyof Subject] = matchedValue as unknown as never;
                }else{
                    if (this.filterOption == 1) {
                        subject.filtered_block_id = this.blockId;
                    }
                }
                if (!map.has(subject.seqNumber)) {
                    map.set(subject.seqNumber, []);
                }
                map.get(subject.seqNumber)!.push(log);
            });
        }

        map.forEach((logs, seqNumber) => {
            subjects.find(subject => subject.seqNumber === seqNumber)?.snapshot.push({
                block_id: this.blockId,
                case_index: this.caseIndex,
                block_type: 8,
                logs: logs
            });
        });
        calcLog(` 계산된 과목들 : ${subjects.filter(subject => subject.filtered_block_id == 0).length}개`);
        calcLog(`필터링된 과목들 : ${subjects.filter(subject => subject.filtered_block_id > 0).length}개`);
        // calcLog(subjects.map(s => s.filtered_block_id));
        return { ctx, subjects };
    }

    private mappingScore(inputValue: any) : {matched: boolean, matchedValue: any} {
        if (isEmpty(inputValue)) {
            return {matched: false, matchedValue: "빈 값"};
        } else {
            let matched: boolean = false;
            let matchedValue : any = null;

            for (let c = 0; c < this.table[0].length; c++) {
                const input = this.table[0][c];
                const output = this.table[1][c];
                if (inputValue as number && this.inputRange == 1) {
                    const start: number = input.split('-')[0] as unknown as number;
                    const end: number = input.split('-')[1] as unknown as number;
                    if (Number(inputValue) >= start && Number(inputValue) < end) {
                        matched = true;
                    }
                    // calcLog(`  ${subject.subjectName} : ${start} <= '${inputValue}' < ${end} : ${matched ? '✅' : '❌'}`);
                } else if (this.inputRange == 0) {
                    if (inputValue == input) {
                        matched = true;
                    }
                    // console.log(`${inputValue} == ${input} : ${matched}`);
                }
                if (matched) {
                    calcLog(`  계산 결과 : ${inputValue} -> ${output}`);
                    matchedValue = output;
                    break;
                }
            }
            return {matched: matched, matchedValue: matchedValue};
        }
    }
}           