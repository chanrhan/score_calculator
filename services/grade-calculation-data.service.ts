// services/grade-calculation-data.service.ts
// 성적 계산에 필요한 모든 데이터를 로딩하는 서비스

import { PrismaClient } from '@prisma/client';
import type { Context, Subject, TokenMenuStore } from '@/types/domain';
import { BLOCK_TYPE } from '@/types/block-types';
import { convertGridToHierarchical } from '@/lib/adapters/componentGridDb';
import { calcLog } from '@/lib/utils/calcLogger';

const prisma = new PrismaClient();

export class GradeCalculationDataService {
  private tokenMenuStore: TokenMenuStore = new Map();
  private pipelineData: any = null;

  /**
   * 성적 계산에 필요한 모든 데이터를 로딩
   */
  async loadAllData(pipelineId: number, schoolCode: string, studentIds?: string[]): Promise<{
    students: Context[];
    tokenMenuStore: TokenMenuStore;
    pipelineData: any;
  }> {
    console.log(`📊 성적 계산 데이터 로딩 시작 - Pipeline ID: ${pipelineId}, School Code: ${schoolCode}`);

    // 1. Token Menu 데이터 로딩 (전형/단위 필터 적용을 위해 선행)
    await this.loadTokenMenuData(schoolCode);
    console.log(`✅ Token Menu 데이터 로딩 완료: ${this.tokenMenuStore.size}개 항목`);

    // 2. 학생 및 과목 데이터 로딩 (토큰 메뉴 기반 필터 적용)
    const students = await this.loadStudentAndSubjectData(schoolCode, studentIds);
    console.log(`✅ 학생 데이터 로딩 완료: ${students.length}명`);

    // 3. 파이프라인 데이터 로딩
    this.pipelineData = await this.loadPipelineData(pipelineId);
    console.log(`✅ 파이프라인 데이터 로딩 완료: ${this.pipelineData?.components?.length || 0}개 컴포넌트`);
    
    

    
    return {
      students,
      tokenMenuStore: this.tokenMenuStore,
      pipelineData: this.pipelineData
    };
  }

  /**
   * 1-1. 학생, 과목 데이터 불러오기
   * - 모든 student_base_info와 모든 subject_score를 가져오기
   * - 가져온 과목 데이터를 학생별로 그룹화 (identifyNumber가 학생의 식별번호)
   */
  private async loadStudentAndSubjectData(schoolCode: string, studentIds?: string[]): Promise<Context[]> {
    try {
      // 학생 기본 정보 로딩 (raw SQL)
      const studentBaseInfos : any[] = await this.loadStudentBaseInfo(studentIds);

      // 학생이 하나도 없으면 즉시 반환 (불필요한 과목 조회 방지)
      if (!Array.isArray(studentBaseInfos) || studentBaseInfos.length === 0) {
        return [];
      }

      // 과목 점수 데이터 로딩 (약 12만개 레코드) (raw SQL)
      // 이미 불러온 학생 식별번호로만 제한하여 과목 데이터를 조회
      const loadedStudentIds = studentBaseInfos.map(s => String(s.identifyNumber));
      const subjectScores : any[] = await this.loadSubjectScores(schoolCode, loadedStudentIds);

      console.log(`📋 학생 데이터: ${studentBaseInfos.length}명, 과목 데이터: ${subjectScores.length}개`);
      // 학생별로 과목 데이터 그룹화
      const studentsMap = new Map<string, any>();
      
      // 학생 기본 정보를 맵에 저장
      studentBaseInfos.forEach(student => {
        studentsMap.set(`${student.admissionCode}-${student.majorCode}-${student.identifyNumber}`, {
          identifyNumber: student.identifyNumber,
          admissionCode: student.admissionCode,
          majorCode: student.majorCode,
          graduateYear: student.graduateYear,
          applicantScCode: student.applicantScCode,
          graduateGrade: student.graduateGrade,
          subjects: []
        });
      });

      const subjectGroupTokenMenuItems = this.getTokenMenuItems('subject_group');
      const subjectGroupMap = new Map<string, string>();
      subjectGroupTokenMenuItems.forEach(item => {
        subjectGroupMap.set(item.value, item.label);
      });


      // 과목 데이터를 학생별로 그룹화
      subjectScores.forEach(subject => {
        const student = studentsMap.get(`${subject.admissionCode}-${subject.majorCode}-${subject.identifyNumber}`);
        if (student) {         
          for(const [subjectGroup, subjectGroupName] of subjectGroupMap.entries()) {
            if(subjectGroup.includes(subject.subjectGroup)) {
              subject.subjectGroup = subjectGroupName;
              break;
            }
          }
          const subjectData: Subject = {
            yearterm: Number(`${subject.grade}${subject.term}`),
            subjectName: subject.subjectName,
            seqNumber: subject.seqNumber,
            grade: subject.grade,
            term: subject.term,
            unit: subject.unit,
            organizationCode: subject.organizationCode,
            subjectGroup: subject.subjectGroup,
            courseCode: subject.courseCode,
            subjectCode: subject.subjectCode,
            assessment: subject.assessment,
            achievement: subject.achievement,
            achievementRatio: subject.achievementRatio,
            studentCount: subject.studentCount,
            originalScore: subject.originalScore,
            avgScore: subject.avgScore,
            standardDeviation: subject.standardDeviation,
            rankingGrade: subject.rankingGrade,
            subjectSeparationCode: subject.subjectSeparationCode,
            filtered_block_id: 0, // 초기값 (0: 필터링 안됨, 1 이상: 필터링 된 블록 ID)
            score: null, // 초기값
            snapshot: []

            // 기존 호환성 필드들
            // organizationName: subject.organizationName,
            // credit: subject.credit
          };
          student.subjects.push(subjectData);
        }
      });

      // Context 배열로 변환
      const contexts: Context[] = Array.from(studentsMap.values()).map(student => {
        // const subjectGroupUnitSumMap = new Map<string, number>();
        // student.subjects.forEach((s: Subject) => {
        //   if(!subjectGroupUnitSumMap.has(s.subjectGroup)){
        //     subjectGroupUnitSumMap.set(s.subjectGroup, 0);
        //   }
        //   subjectGroupUnitSumMap.set(s.subjectGroup, subjectGroupUnitSumMap.get(s.subjectGroup)! + s.unit);
        // });
        const varMap = new Map<string, string>();
        // subjectGroupUnitSumMap.forEach((sum, subjectGroup) => {
        //   varMap.set(`${subjectGroup}_unit_sum`, sum.toString());
        // });

        return {
        identifyNumber: student.identifyNumber,
        admissionCode: student.admissionCode,
        majorCode: student.majorCode,
        graduateYear: student.graduateYear,
        graduateGrade: student.graduateGrade,
        applicantScCode: student.applicantScCode,
        finalScore: 0, // 초기값
        finalRank: 0, // 초기값
        subjects: student.subjects,
        vars: varMap // 초기 빈 Map
      };
    });

      return contexts;
    } catch (error) {
      console.error('❌ 학생 및 과목 데이터 로딩 실패:', error);
      throw error;
    }
  }

  /**
   * 1-2. 부가 데이터 불러오기
   * - 모든 Token_menu/items 데이터를 불러오기
   * - where 조건: schoolCode
   * - 불러온 token_menu는 전역 store 형태로 저장
   */
  private async loadTokenMenuData(schoolCode: string): Promise<void> {
    try {
      // Token Menu 데이터 로딩
      const tokenMenus = await prisma.token_menu.findMany({
        where: { univ_id: schoolCode },
        include: {
          items: true
        }
      });

      // Token Menu Store에 저장 (key-value 형태)
      tokenMenus.forEach(menu => {
        // 메뉴 자체를 키로 저장
        this.tokenMenuStore.set(menu.key, {
          id: menu.id,
          key: menu.key,
          name: menu.name,
          scope: menu.scope,
          items: menu.items
        });

        // 각 아이템도 개별적으로 저장 (접근 편의성)
        menu.items.forEach((item: any) => {
          const itemKey = `${menu.key}.${item.label}`;
          this.tokenMenuStore.set(itemKey, {
            id: item.id,
            key: item.label,
            name: item.label,
            value: item.value,
            menuId: item.menu_key
          });
        });
      });
    } catch (error) {
      console.error('❌ Token Menu 데이터 로딩 실패:', error);
      throw error;
    }
  }

  /**
   * 1-3. 계산 데이터 불러오기
   * - 현재 pipeline_id에 해당하는 component_grid들과 block들 데이터를 불러오기
   */
  private async loadPipelineData(pipelineId: number): Promise<any> {
    try {
      const pipeline = await prisma.pipelines.findUnique({
        where: { id: pipelineId },
        include: {
          components: {
            include: {
              blocks: {
                orderBy: { order: 'asc' }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!pipeline) {
        throw new Error(`Pipeline ID ${pipelineId}를 찾을 수 없습니다.`);
      }

      // 각 component에 divisionHead 데이터 추가
      for (const component of pipeline.components ?? []) {
        // division_head_header, division_head_body, division_head_active를 component 객체에 포함
        if (component.division_head_header !== null || component.division_head_body !== null) {
          (component as any).divisionHead = {
            header: (component.division_head_header as any) || [],
            body: (component.division_head_body as any) || [],
            isActive: component.division_head_active ?? true,
          };
        } else {
          (component as any).divisionHead = null;
        }
      }

      return pipeline;
    } catch (error) {
      console.error('❌ 파이프라인 데이터 로딩 실패:', error);
      throw error;
    }
  }

  /**
   * Token Menu Store에서 값 조회
   */
  getTokenValue(key: string): any {
    return this.tokenMenuStore.get(key);
  }

  /**
   * Token Menu Store에서 메뉴 아이템 조회
   */
  getTokenMenuItems(menuKey: string): any[] {
    const menu = this.tokenMenuStore.get(menuKey);
    return menu?.items || [];
  }

  /**
   * 파이프라인 데이터 조회
   */
  getPipelineData(): any {
    return this.pipelineData;
  }

  /**
   * 학생 기본 정보 로딩 (중복 제거)
   */
  private async loadStudentBaseInfo(studentIds?: string[]): Promise<any[]> {
    const baseQuery = `
      SELECT 
        "identifyNumber",
        split_part(mogib2_code, '-', 1) as "admissionCode", 
        split_part(mogib2_code, '-', 2) as "majorCode",
        "graduateYear",
        "graduateGrade",
        "applicantScCode"
      FROM student_base_info
      
    `;
    // 토큰 메뉴에서 전형/단위 코드 목록 수집
    const admissionItems: any[] = this.getTokenMenuItems('admission_code') || [];
    const majorItems: any[] = this.getTokenMenuItems('major_code') || [];

    const admissionCodes = admissionItems
      .map((i: any) => String(i.value))
      .filter(v => v && v.trim().length > 0)
      .map(v => `'${v.replace(/'/g, "''")}'`);
    // console.log('admissionCodes: ', admissionCodes);

    const majorCodes = majorItems
      .map((i: any) => String(i.value))
      .filter(v => v && v.trim().length > 0)
      .map(v => `'${v.replace(/'/g, "''")}'`);

    const whereClauses: string[] = [];
    if (Array.isArray(studentIds) && studentIds.length > 0) {
      const ids = studentIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
      whereClauses.push(`"identifyNumber" IN (${ids})`);
    }
    if (!admissionCodes.includes("'*'") && admissionCodes.length > 0) {
      whereClauses.push(`split_part(mogib2_code, '-', 1) IN (${admissionCodes.join(',')})`);
    }
    if (!majorCodes.includes("'*'") && majorCodes.length > 0) {
      whereClauses.push(`split_part(mogib2_code, '-', 2) IN (${majorCodes.join(',')})`);
    }

    const query = whereClauses.length > 0
      ? `${baseQuery} WHERE ${whereClauses.join(' AND ')}`
      : baseQuery;

    return await prisma.$queryRawUnsafe(query);
  }

  /**
   * 과목 점수 데이터 로딩 (중복 제거)
   */
  private async loadSubjectScores(schoolCode: string, loadedStudentIds?: string[]): Promise<any[]> {
    const baseQuery = `
      SELECT 
        "identifyNumber",
        seq_number as "seqNumber",
        grade,
        term,
        unit,
        split_part(mogib2_code, '-', 1) as "admissionCode",
        split_part(mogib2_code, '-', 2) as "majorCode",
        ss."organizationCode",
        so.subject_group as "subjectGroup",
        ss."courceCode" as "courseCode", 
        ss."subjectName",
        ss."subjectCode",
        assessment,
        achievement,
        "achievementRatio",
        "studentCount",
        "originalScore",
        "avgScore",
        "standardDeviation",
        "rankingGrade",
        COALESCE(ss2."subject_separation_code", ss."subjectSeparationCode") as "subjectSeparationCode"
      FROM subject_score ss
      LEFT JOIN subject_organization so ON ss."subjectCode" = so."subject_code"
        and ss."organizationCode" = so."organization_code" 
        and ss."courceCode" = so."course_code"
        and so.univ_id = '${schoolCode}'
      LEFT JOIN subject_separation ss2 ON ss."subjectName" = ss2."subject_name"
        and ss2.univ_id = '${schoolCode}'
      
    `;
    // 이미 로드된 학생 식별번호가 제공되면 IN 조건 구성
    let query = baseQuery;
    if (Array.isArray(loadedStudentIds) && loadedStudentIds.length > 0) {
      const ids = loadedStudentIds.map(id => `'${id.replace(/'/g, "''")}'`).join(',');
      query = `${baseQuery} WHERE ss."identifyNumber" IN (${ids})`;
    }
    return await prisma.$queryRawUnsafe(query);
  }

  /**
   * 리소스 정리
   */
  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}
