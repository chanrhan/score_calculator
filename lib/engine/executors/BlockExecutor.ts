import { Context, Subject } from "@/types/domain";

export abstract class BlockExecutor {
    abstract readonly type: number;
    abstract readonly name: string;
    public readonly blockId: number;
    public readonly caseIndex: number;

    constructor(blockId: number, caseIndex: number) {
        this.blockId = blockId;
        this.caseIndex = caseIndex;
    }

    public abstract execute(ctx: Context, subjects: Subject[]): { ctx: Context, subjects: Subject[] }

    protected getContextProperty(ctx: Context, property: string): any {
        if(ctx[property as keyof Context] !== undefined) {
            return ctx[property as keyof Context];
        }
        return ctx.vars?.get(property) || null;
    }

    protected setContextProperty(ctx: Context, subjects: Subject[], property: string, value: any): void {
        if (ctx[property as keyof Context] !== undefined) {
            ctx[property as keyof Context] = value as unknown as never;
            return;
        }

        if (subjects.length > 0 && subjects[0][property as keyof Subject] !== undefined) {
            subjects.forEach((subject) => {
                subject[property as keyof Subject] = value as unknown as never;
            });
            return;
        }
        ctx.vars.set(property, value);
    }

    protected getSubjectProperty(subject: Subject, property: string): any {
        if(subject[property as keyof Subject] !== undefined) {
            return subject[property as keyof Subject];
        }
        return subject.vars?.get(property) || null;
    }
    
}