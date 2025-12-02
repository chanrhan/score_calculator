import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Subject as DomainSubject } from '@/types/domain'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pipelineId = searchParams.get('pipelineId')
    const studentId = searchParams.get('studentId')
    // schoolCode는 필요 없음 (DB에 저장된 결과를 읽음)

    if (!pipelineId || !studentId) {
      return NextResponse.json({ success: false, message: 'pipelineId, studentId는 필수입니다.' }, { status: 400 })
    }

    const pipelineIdNum = parseInt(pipelineId)
    if (isNaN(pipelineIdNum) || pipelineIdNum <= 0) {
      return NextResponse.json({ success: false, message: 'pipelineId는 양의 정수여야 합니다.' }, { status: 400 })
    }

    // DB에 저장된 grade_results와 student_base_info를 조인하여 조회
    const rec = await prisma.grade_results.findFirst({
      where: {
        pipeline_id: pipelineIdNum,
        student_id: String(studentId)
      },
      select: { 
        subjects: true,
        final_score: true,
        student_id: true
      }
    })

    if (!rec) {
      return NextResponse.json({ success: false, message: '학생 결과를 찾을 수 없습니다.' }, { status: 404 })
    }

    // student_base_info에서 해당 학생의 정보 조회 (identifyNumber로 조회)
    const studentInfo = await prisma.student_base_info.findFirst({
      where: {
        identifyNumber: String(studentId)
      },
      select: {
        mogib2_code: true,
        identifyNumber: true,
        graduateYear: true,
        graduateGrade: true
      }
    })

    if (!studentInfo) {
      return NextResponse.json({ success: false, message: '학생 기본 정보를 찾을 수 없습니다.' }, { status: 404 })
    }

    // mogib2_code 파싱 ({전형코드}-{단위코드} 형식)
    const mogib2Code = studentInfo.mogib2_code
    const [admissionCode, majorCode] = mogib2Code.split('-')

    // 파이프라인의 대학 코드(univ_id) 조회
    const pipeline = await prisma.pipelines.findUnique({
      where: { id: BigInt(pipelineIdNum) },
      select: { univ_id: true }
    } as any)
    if (!pipeline) {
      return NextResponse.json({ success: false, message: '파이프라인을 찾을 수 없습니다.' }, { status: 404 })
    }

    // token_menu_item에서 전형/단위 이름 조회 (value=코드, label=이름)
    const [admissionItem, majorItem] = await Promise.all([
      prisma.token_menu_item.findFirst({
        where: { univ_id: pipeline.univ_id, menu_key: 'admission_code', value: String(admissionCode) },
        select: { label: true, value: true }
      } as any),
      prisma.token_menu_item.findFirst({
        where: { univ_id: pipeline.univ_id, menu_key: 'major_code', value: String(majorCode) },
        select: { label: true, value: true }
      } as any)
    ])

    const finalScore : number = Number(rec.final_score)
    const subjects: DomainSubject[] = Array.isArray(rec.subjects) ? rec.subjects as DomainSubject[] : []
    // const subjects = rawSubjects.map((s: DomainSubject) => ({
    //   // 반영 여부 판단용
    //   filtered_block_id: s.filtered_block_id ?? 0,
    //   // 표시 컬럼들
    //   grade: s.grade ?? s.gradeNumber ?? null,
    //   term: s.term ?? s.semester ?? null,
    //   subjectName: s.subjectName ?? s.name ?? '',
    //   subjectGroup: s.subjectGroup ?? s.curriculumName ?? s.organizationName ?? '',
    // }))
    // console.table(subjects[0]);

    return NextResponse.json({ 
      success: true, 
      data: {
        finalScore: finalScore, 
        subjects: subjects,
        studentInfo: {
          identifyNumber: studentInfo.identifyNumber,
          mogib2Code: mogib2Code,
          admissionCode: admissionCode,
          admissionName: admissionItem?.label ?? admissionCode,
          majorCode: majorCode,
          majorName: majorItem?.label ?? majorCode,
          graduateGrade: studentInfo.graduateGrade ?? null,
          graduateYear: studentInfo.graduateYear ?? null
        }
      } 
    })
  } catch (error) {
    console.error('❌ 학생 상세 조회 에러:', error)
    return NextResponse.json({ success: false, message: '학생 상세 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}


