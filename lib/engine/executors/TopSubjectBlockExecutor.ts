import { BlockExecutor } from "./BlockExecutor";
import { CalculationLog, Context, Subject } from "@/types/domain";
import { calcLog } from "../../utils/calcLogger";
import { BLOCK_TYPE } from "@/types/block-types";
import { ca } from "date-fns/locale";

export class TopSubjectBlockExecutor extends BlockExecutor {
    public override readonly type: number = 5;
    public override readonly name: string = "TopSubject";

    private mode: number;
    private scoreType: string;
    private scoreItem: string;
    private scoreAsc: boolean;
    private topSliceNumber: number;
    private sortOrders: string[];

    private collator: Intl.Collator;

    constructor(blockId: number, caseIndex: number, headerRowCells: any[], bodyRowCells: any[]) {
        super(blockId, caseIndex);
        this.mode = bodyRowCells[0]?.[0] || 1;
        this.scoreType = bodyRowCells[0]?.[1] || null;
        this.scoreItem = this.scoreType?.[0];
        this.scoreAsc = Number(this.scoreType[1]) == 0;
        this.topSliceNumber = bodyRowCells[0]?.[3] || 0;
        this.sortOrders = bodyRowCells[0]?.[5] || [];
        this.collator = new Intl.Collator('ko', { sensitivity: 'base', numeric: true });
    }

    public override execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] } {
        const map: Map<number, CalculationLog[]> = new Map();

        const selectedSubjects: Subject[] = [];
        let index = 0;
        if (this.mode == 0) {  // 교과군별, organizationCode가 같은 과목들 중 score 기준으로 각각 상위 N개
            // organizationCode별로 그룹화
            const groupedByOrganization = new Map<string, Subject[]>();

            subjects.forEach(subject => {
                const orgCode = subject.organizationCode;
                if (!groupedByOrganization.has(orgCode)) {
                    groupedByOrganization.set(orgCode, []);
                }
                groupedByOrganization.get(orgCode)!.push(subject);
            });
            // 각 그룹에서 상위 N개씩 선택

            groupedByOrganization.forEach(groupSubjects => {
                // 점수 기준으로 내림차순 정렬 후 상위 N개 선택
                const topSubjects = this.sortSubjects(groupSubjects);
                topSubjects.forEach(subject => {
                    if (subject.filtered_block_id == 0) {
                        let log: CalculationLog = {
                            input_key: null,
                            input: `교과군별 상위 (${index + 1}/${this.topSliceNumber})등`,
                            output_key: null,
                            output: null,
                        };

                        if (index >= this.topSliceNumber) {
                            subject.filtered_block_id = this.blockId;
                            log.output = "제외";
                        } else {
                            log.output = "포함";
                        }
                        if (!map.has(subject.seqNumber)) {
                            map.set(subject.seqNumber, []);
                        }
                        map.get(subject.seqNumber)!.push(log);
                        index++;
                    }
                    selectedSubjects.push(subject);
                });
            });

        } else if (this.mode == 1) { // 전체, 전체 과목 중 score 기준으로 상위 N개
            // 전체 과목을 점수 기준으로 내림차순 정렬 후 상위 N개 선택
            const tmp: Subject[] = this.sortSubjects(subjects);
            calcLog('sort: ', tmp.map((subject: Subject) => {
                return {
                    subjectName: subject.subjectName,
                    achievement: subject.achievement,
                    unit: subject.unit,
                    yearterm: subject.yearterm
                };
            }));
            tmp.forEach(subject => {
                if (subject.filtered_block_id == 0) {
                    let log: CalculationLog = {
                        input_key: null,
                        input: `전체 상위 (${index + 1}/${this.topSliceNumber})등`,
                        output_key: null,
                        output: null,
                    };
                    if (index >= this.topSliceNumber) {
                        subject.filtered_block_id = this.blockId;
                        calcLog(`제외: ${subject.subjectName}, ${subject.achievement}`);
                        log.output = "제외";
                    } else {
                        log.output = "포함";
                    }
                    if (!map.has(subject.seqNumber)) {
                        map.set(subject.seqNumber, []);
                    }
                    map.get(subject.seqNumber)!.push(log);
                    ++index;
                }

                selectedSubjects.push(subject);
            });

        }
        map.forEach((logs, seqNumber) => {
            subjects.find(subject => subject.seqNumber === seqNumber)?.snapshot.push({
                block_id: this.blockId,
                case_index: this.caseIndex,
                block_type: 5,
                logs: logs
            });
        });

        subjects = selectedSubjects;

        return { ctx, subjects };
    }

    private sortSubjects(subjects: Subject[]): Subject[] {
        return subjects.sort((a, b) => {
            const aScore = a[this.scoreItem as unknown as keyof Subject] as number;
            const bScore = b[this.scoreItem as unknown as keyof Subject] as number;
            // calcLog(`${a.subjectName}: ${aScore}, ${b.subjectName}: ${bScore}`);
            if (aScore == bScore) {
                for (let i = 0; i < this.sortOrders.length; i++) {
                    const sortOrder = this.sortOrders[i];
                    const sortItem = sortOrder[0];
                    const asc : boolean = Number(sortOrder[1]) == 0;
                    const aRaw = a[sortItem as keyof Subject] as unknown;
                    const bRaw = b[sortItem as keyof Subject] as unknown;

                    let result: number = 0;
                    if (aRaw == bRaw) { 
                        continue;
                    }
                    if (Number(aRaw) && Number(bRaw)) {
                        result = asc ? (Number(aRaw) - Number(bRaw)) : (Number(bRaw) - Number(aRaw));
                    }
                    const cmp = this.collator.compare(String(aRaw), String(bRaw));
                    if (cmp !== 0) {
                        result = asc ? cmp : -cmp;
                    }
                    const op = result > 0 ? '>' : '<';
                    // calcLog(`${sortItem} ${a.subjectName} : ${b.subjectName} -> ${aRaw} ${op} ${bRaw}`);
                    return result;
                }
            }
            let result: number = 0;
            if (Number(aScore) && Number(bScore)) {
                result = this.scoreAsc ? (Number(aScore) - Number(bScore)) : (Number(bScore) - Number(aScore));
            }
            const cmp = this.collator.compare(String(aScore), String(bScore));
            if (cmp !== 0) {
                result = this.scoreAsc ? cmp : -cmp;
            }
            const op = result > 0 ? '>' : '<';
            // calcLog(`${this.scoreItem} ${a.subjectName}:${b.subjectName} -> ${aScore}${op}${bScore}`);
            return result;
        });
    }
}