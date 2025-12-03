import { CalculationLog, Subject } from "@/types/domain";

/**
 * 블록 실행기의 계산 로그를 관리하는 공통 모듈
 * 로그 수집 및 snapshot 저장 로직을 캡슐화합니다.
 */
export class CalculationLogManager {
    private logs: Map<number, CalculationLog[]> = new Map();

    /**
     * 특정 과목(seqNumber)에 대한 로그를 추가합니다.
     * @param seqNumber 과목의 시퀀스 번호
     * @param log 추가할 계산 로그
     */
    public addLog(seqNumber: number, log: CalculationLog): void {
        if (!this.logs.has(seqNumber)) {
            this.logs.set(seqNumber, []);
        }
        this.logs.get(seqNumber)!.push(log);
    }

    /**
     * 수집된 모든 로그를 각 과목의 snapshot에 저장합니다.
     * @param subjects 과목 배열
     * @param blockId 블록 ID
     * @param caseIndex 케이스 인덱스
     * @param blockType 블록 타입
     */
    public saveToSnapshot(
        subjects: Subject[],
        blockId: number,
        caseIndex: number,
        blockType: number
    ): void {
        this.logs.forEach((logs, seqNumber) => {
            const subject = subjects.find(s => s.seqNumber === seqNumber);
            if (subject) {
                subject.snapshot.push({
                    block_id: blockId,
                    case_index: caseIndex,
                    block_type: blockType,
                    logs: logs
                });
            }
        });
    }

    /**
     * 로그를 초기화합니다.
     */
    public clear(): void {
        this.logs.clear();
    }

    /**
     * 현재 수집된 로그 맵을 반환합니다.
     * @returns 로그 맵
     */
    public getLogs(): Map<number, CalculationLog[]> {
        return this.logs;
    }
}

