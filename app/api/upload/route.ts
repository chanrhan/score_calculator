import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as sqlite3 from 'sqlite3'
import * as fs from 'fs'
import { emitProgress } from '@/lib/socket-server'

export async function POST(request: NextRequest) {
  try {
    
    // WebSocket으로 업로드 시작 알림
    emitProgress('upload-progress', {
      progress: 0,
      message: '파일 업로드를 시작합니다...'
    })
    
    // 파일 크기 제한 설정
    const maxSize = 3 * 1024 * 1024 * 1024 // 3GB
    
    // 임시 파일 경로 생성 (절대 경로 사용)
    const os = require('os')
    const path = require('path')
    let tempFilePath = path.join(os.tmpdir(), `temp_${Date.now()}.db3`)
    const writeStream = fs.createWriteStream(tempFilePath)
    
    
    // 3GB 파일을 처리하기 위해 스트림으로 읽고 바로 쓰기
    const reader = request.body?.getReader()
    
    if (!reader) {
      emitProgress('upload-progress', {
        progress: 0,
        message: '요청 본문을 읽을 수 없습니다.',
        isComplete: true
      })
      return NextResponse.json({ error: '요청 본문을 읽을 수 없습니다.' }, { status: 400 })
    }
    
    let totalSize = 0
    let lastLogTime = Date.now()
    let lastProgressUpdate = 0
    
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = Buffer.from(value)
        totalSize += chunk.length
        
        // 모든 데이터를 바로 파일에 쓰기 (multipart 파싱 없이)
        writeStream.write(chunk)
        
        // 진행률 계산 (0-50%: 파일 업로드)
        const expectedSize = 2185755853 // 예상 파일 크기
        const uploadProgress = Math.min(Math.round((totalSize / expectedSize) * 50), 50)
        const currentTime = Date.now()
        
        // 진행도 업데이트 (1%마다 또는 10MB마다 또는 5초마다)
        if (uploadProgress > lastProgressUpdate || 
            totalSize % (10 * 1024 * 1024) < chunk.length ||
            currentTime - lastLogTime > 5000) {
          
          const speed = totalSize / ((currentTime - lastLogTime) / 1000) / 1024 / 1024 // MB/s
          const message = `파일 업로드 중... ${uploadProgress}% (${(totalSize / 1024 / 1024).toFixed(1)}MB, ${speed.toFixed(1)}MB/s)`
          
          emitProgress('upload-progress', {
            progress: uploadProgress,
            message: message
          })
          
          process.stdout.write(`\r📊 업로드 진행률: ${uploadProgress}% | 총 읽은 크기: ${(totalSize / 1024 / 1024).toFixed(1)}MB | 속도: ${speed.toFixed(1)}MB/s`)
          lastLogTime = currentTime
          lastProgressUpdate = uploadProgress
        }
        
        // 파일 크기 제한 확인
        if (totalSize > maxSize) {
          writeStream.end()
          fs.unlinkSync(tempFilePath)
          emitProgress('upload-progress', {
            progress: 0,
            message: '파일 크기가 3GB를 초과합니다.',
            isComplete: true
          })
          return NextResponse.json({ error: '파일 크기가 3GB를 초과합니다.' }, { status: 400 })
        }
      }
    } catch (error) {
      console.error('스트림 읽기 중 오류:', error)
      writeStream.end()
      fs.unlinkSync(tempFilePath)
      emitProgress('upload-progress', {
        progress: 0,
        message: '파일 업로드 중 연결이 끊어졌습니다.',
        isComplete: true
      })
      return NextResponse.json({ error: '파일 업로드 중 연결이 끊어졌습니다.' }, { status: 500 })
    }
    
    // 파일 쓰기 완료 대기
    writeStream.end()
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('파일 쓰기 타임아웃'))
      }, 30000) // 30초 타임아웃
      
      writeStream.on('finish', () => {
        clearTimeout(timeout)
        resolve()
      })
      writeStream.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })
    })
    
    
    // 파일 크기 확인 (3GB 제한)
    if (totalSize > maxSize) {
      fs.unlinkSync(tempFilePath)
      emitProgress('upload-progress', {
        progress: 0,
        message: '파일 크기가 3GB를 초과합니다.',
        isComplete: true
      })
      return NextResponse.json({ error: '파일 크기가 3GB를 초과합니다.' }, { status: 400 })
    }

    // 기존 데이터 삭제
    emitProgress('upload-progress', {
      progress: 50,
      message: '기존 데이터를 삭제하고 있습니다...'
    })
    
    const deleteStudents = await prisma.student_base_info.deleteMany()
    const deleteSubjects = await prisma.subject_score.deleteMany()

    // DB 연결 테스트
    const testCount = await prisma.student_base_info.count()

    // 파일 존재 여부 및 크기 확인
    if (!fs.existsSync(tempFilePath)) {
      emitProgress('upload-progress', {
        progress: 0,
        message: '임시 파일이 생성되지 않았습니다.',
        isComplete: true
      })
      return NextResponse.json({ error: '임시 파일이 생성되지 않았습니다.' }, { status: 500 })
    }
    
    const fileStats = fs.statSync(tempFilePath)
    
    if (fileStats.size === 0) {
      fs.unlinkSync(tempFilePath)
      emitProgress('upload-progress', {
        progress: 0,
        message: '업로드된 파일이 비어있습니다.',
        isComplete: true
      })
      return NextResponse.json({ error: '업로드된 파일이 비어있습니다.' }, { status: 400 })
    }
    
    // 파일 헤더 확인 (SQLite 파일은 "SQLite format 3"로 시작)
    // 2GB 제한을 피하기 위해 파일 스트림으로 헤더만 읽기
    const fileHeaderBuffer = Buffer.alloc(15)
    const fileHandle = fs.openSync(tempFilePath, 'r')
    fs.readSync(fileHandle, fileHeaderBuffer, 0, 15, 0)
    fs.closeSync(fileHandle)

    const fileHeader = fileHeaderBuffer.toString('utf8')

    // 파일 헤더가 multipart boundary로 시작하는 경우 실제 파일 데이터 추출
    if (fileHeader.startsWith('------WebKitFormBoundary') || fileHeader.startsWith('------WebKitFor')) {
      emitProgress('upload-progress', {
        progress: 55,
        message: 'SQLite 데이터를 추출하고 있습니다...'
      })
      
      // 전체 파일에서 SQLite 헤더 찾기
      const fileStats = fs.statSync(tempFilePath)
      const searchSize = Math.min(fileStats.size, 10 * 1024 * 1024) // 최대 10MB 검색
      
      const searchBuffer = Buffer.alloc(searchSize)
      const searchHandle = fs.openSync(tempFilePath, 'r')
      fs.readSync(searchHandle, searchBuffer, 0, searchSize, 0)
      fs.closeSync(searchHandle)
      
      const searchContent = searchBuffer.toString('utf8')
      const sqliteIndex = searchContent.indexOf('SQLite format 3')
      
      let sqliteStartIndex = -1
      
      if (sqliteIndex === -1) {
        // 파일의 중간 부분에서도 검색
        const midPoint = Math.floor(fileStats.size / 2)
        const midSearchSize = Math.min(fileStats.size - midPoint, 10 * 1024 * 1024)
        
        const midSearchBuffer = Buffer.alloc(midSearchSize)
        const midSearchHandle = fs.openSync(tempFilePath, 'r')
        fs.readSync(midSearchHandle, midSearchBuffer, 0, midSearchSize, midPoint)
        fs.closeSync(midSearchHandle)
        
        const midSearchContent = midSearchBuffer.toString('utf8')
        const midSqliteIndex = midSearchContent.indexOf('SQLite format 3')
        
        if (midSqliteIndex === -1) {
          fs.unlinkSync(tempFilePath)
          emitProgress('upload-progress', {
            progress: 0,
            message: '업로드된 파일에서 SQLite 데이터를 찾을 수 없습니다.',
            isComplete: true
          })
          return NextResponse.json({
            error: '업로드된 파일에서 SQLite 데이터를 찾을 수 없습니다. 파일이 손상되었거나 올바르지 않은 형식입니다.'
          }, { status: 400 })
        }
        
        sqliteStartIndex = midPoint + midSqliteIndex
      } else {
        sqliteStartIndex = sqliteIndex
      }
      
      // SQLite 데이터만 추출해서 새로운 파일로 저장
      const cleanFilePath = tempFilePath.replace('.db3', '_clean.db3')
      const readStream = fs.createReadStream(tempFilePath, { start: sqliteStartIndex })
      const writeStream = fs.createWriteStream(cleanFilePath)
      
      await new Promise<void>((resolve, reject) => {
        readStream.pipe(writeStream)
        writeStream.on('finish', () => {
          resolve()
        })
        writeStream.on('error', reject)
      })
      
      // 원본 파일 삭제하고 정리된 파일 사용
      fs.unlinkSync(tempFilePath)
      tempFilePath = cleanFilePath
      
    } else if (!fileHeader.startsWith('SQLite format 3')) {
      fs.unlinkSync(tempFilePath)
      emitProgress('upload-progress', {
        progress: 0,
        message: '업로드된 파일이 유효한 SQLite 데이터베이스가 아닙니다.',
        isComplete: true
      })
      return NextResponse.json({
        error: '업로드된 파일이 유효한 SQLite 데이터베이스가 아닙니다. 파일이 손상되었거나 올바르지 않은 형식입니다.'
      }, { status: 400 })
    }
    
    // SQLite 데이터베이스 열기
    emitProgress('upload-progress', {
      progress: 60,
      message: 'SQLite 데이터베이스를 분석하고 있습니다...'
    })
    
    const db = new sqlite3.Database(tempFilePath, sqlite3.OPEN_READONLY)

    try {
    
      // 테이블 목록 조회
      const tables = await new Promise<string[]>((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
          if (err) reject(err)
          else resolve(rows.map((row: any) => row.name))
        })
      })


      // StudentBaseInfo 테이블 처리
      if (tables.includes('StudentBaseInfo')) {
        emitProgress('upload-progress', {
          progress: 65,
          message: '학생 데이터를 조회하고 있습니다...'
        })
        
        const studentData = await new Promise<any[]>((resolve, reject) => {
          db.all("SELECT * FROM StudentBaseInfo", (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
          })
        })



        // 배치 처리로 성능 향상 (배치 크기 축소)
        const batchSize = 100
        const totalBatches = Math.ceil(studentData.length / batchSize)
        
        emitProgress('upload-progress', {
          progress: 70,
          message: `학생 데이터를 PostgreSQL에 삽입하고 있습니다... (0/${totalBatches} 배치)`
        })
        
        for (let i = 0; i < studentData.length; i += batchSize) {
          const batch = studentData.slice(i, i + batchSize)
          const currentBatch = Math.floor(i / batchSize) + 1
          const progress = 70 + Math.round((currentBatch / totalBatches) * 15) // 학생 데이터는 70-85%
          
          await prisma.student_base_info.createMany({
            data: batch.map(student => ({
              identifyNumber: student.IdentifyNumber || '',
              mogib1_code: student.Mogib1 || '',
              mogib2_code: student.Mogib2 || '',
              school_code: student.SchoolCode || '',
              applicantScCode: student.ApplicantScCode ? parseInt(student.ApplicantScCode) : null,
              collegeAdmissionYear: parseInt(student.CollegeAdmissionYear) || null,
              correctionRegisterYN: student.CorrectionRegisterYN,
              examNumber: student.ExamNumber,
              graduateGrade: parseInt(student.GraduateGrade) || null,
              graduateYear: parseInt(student.GraduateYear) || null,
              masterSchoolYN: student.MasterSchoolYN,
              pictureFileName: student.PictureFileName,
              seleScCode: student.SeleScCode,
              socialNumber: student.SocialNumber,
              specializedSchoolYN: student.SpecializedSchoolYN,
              uniqueFileName: student.UniqueFileName,
              updatedAt: new Date()
            }))
          })
          
          const message = `학생 데이터를 PostgreSQL에 삽입하고 있습니다... (${currentBatch}/${totalBatches} 배치)`
          emitProgress('upload-progress', {
            progress: progress,
            message: message
          })
          
          process.stdout.write(`\r📈 학생 데이터 배치 처리: ${currentBatch}/${totalBatches} (${i + batch.length}/${studentData.length}) - 진행률: ${progress}%`)
        }
      }

      // SubjectScore 테이블 처리
      if (tables.includes('SubjectScore')) {
        emitProgress('upload-progress', {
          progress: 85,
          message: '과목 데이터를 조회하고 있습니다...'
        })
        
        const subjectData = await new Promise<any[]>((resolve, reject) => {
          db.all("SELECT * FROM SubjectScore", (err, rows) => {
            if (err) reject(err)
            else resolve(rows)
          })
        })


        // 배치 처리로 성능 향상 (배치 크기 축소)
        const batchSize = 100
        const totalBatches = Math.ceil(subjectData.length / batchSize)
        
        emitProgress('upload-progress', {
          progress: 90,
          message: `과목 데이터를 PostgreSQL에 삽입하고 있습니다... (0/${totalBatches} 배치)`
        })
        
        for (let i = 0; i < subjectData.length; i += batchSize) {
          const batch = subjectData.slice(i, i + batchSize)
          const currentBatch = Math.floor(i / batchSize) + 1
          const progress = 90 + Math.round((currentBatch / totalBatches) * 10) // 과목 데이터는 90-100%
          
          await prisma.subject_score.createMany({
            data: batch.map(subject => ({
              identifyNumber: subject.IdentifyNumber || '',
              mogib1_code: subject.Mogib1 || '',
              mogib2_code: subject.Mogib2 || '',
              seq_number: parseInt(subject.SeqNumber) || 1,
              year: parseInt(subject.Year) || null,
              grade: parseInt(subject.Grade) || null,
              organizationCode: subject.OrganizationCode,
              organizationName: subject.OrganizationName,
              subjectCode: subject.SubjectCode || '',
              subjectName: subject.SubjectName,
              courceCode: subject.CourceCode,
              term: parseInt(subject.Term) || null,
              unit: parseFloat(subject.Unit) || null,
              assessment: subject.Assessment,
              rank: parseInt(subject.Rank) || null,
              sameRank: parseInt(subject.SameRank) || null,
              studentCount: parseInt(subject.StudentCount) || null,
              originalScore: parseFloat(subject.OriginalScore) || null,
              avgScore: parseFloat(subject.AvgScore) || null,
              standardDeviation: parseFloat(subject.StandardDeviation) || null,
              rankingGrade: subject.RankingGrade?.toString() || null,
              rankingGradeCode: subject.RankingGradeCode,
              achievement: subject.Achievement,
              achievementCode: subject.AchievementCode,
              achievementRatio: parseFloat(subject.AchievementRatio) || null,
              subjectSeparationCode: subject.SubjectSeparationCode,
              updatedAt: new Date()
            }))
          })
          
          const message = `과목 데이터를 PostgreSQL에 삽입하고 있습니다... (${currentBatch}/${totalBatches} 배치)`
          emitProgress('upload-progress', {
            progress: progress,
            message: message
          })
          
          process.stdout.write(`\r📈 과목 데이터 배치 처리: ${currentBatch}/${totalBatches} (${i + batch.length}/${subjectData.length}) - 진행률: ${progress}%`)
        }
      }

      // 데이터베이스 연결 종료
      db.close()
      
      // 임시 파일 삭제 (DB 연결 종료 후) - Windows 호환성 개선
      const deleteTempFile = async (filePath: string) => {
        try {
          // 파일이 존재하는지 확인
          if (fs.existsSync(filePath)) {
            // Windows에서 파일 삭제를 위한 지연 처리
            await new Promise(resolve => setTimeout(resolve, 100))
            
            // 파일 삭제 시도
            fs.unlinkSync(filePath)
          }
        } catch (error) {
          
          // Windows에서 파일 삭제 재시도
          try {
            await new Promise(resolve => setTimeout(resolve, 1000))
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
          } catch (retryError) {
          }
        }
      }
      
      await deleteTempFile(tempFilePath)

      // 결과 통계 조회
      const studentCount = await prisma.student_base_info.count()
      const subjectCount = await prisma.subject_score.count()

      process.stdout.write(`\n🎉 업로드 완료 - 학생: ${studentCount} 과목: ${subjectCount}\n`)

      // 완료 메시지 전송
      emitProgress('upload-progress', {
        progress: 100,
        message: `업로드 완료! 학생: ${studentCount}명, 과목: ${subjectCount}건`,
        isComplete: true
      })

      return NextResponse.json({
        success: true,
        message: '파일 업로드가 완료되었습니다.',
        stats: {
          studentCount,
          subjectCount
        }
      })

    } catch (error) {
      console.error('❌ 데이터 처리 중 오류:', error)
      db.close()
      
      // 에러 발생 시 안전한 파일 삭제
      const deleteTempFile = async (filePath: string) => {
        try {
          if (fs.existsSync(filePath)) {
            await new Promise(resolve => setTimeout(resolve, 100))
            fs.unlinkSync(filePath)
          }
        } catch (deleteError) {
        }
      }
      
      await deleteTempFile(tempFilePath)

      // SQLite 오류 코드에 따른 구체적인 메시지
      if (error instanceof Error && 'code' in error) {
        const sqliteError = error as any
        if (sqliteError.code === 'SQLITE_NOTADB') {
          emitProgress('upload-progress', {
            progress: 0,
            message: '업로드된 파일이 유효한 SQLite 데이터베이스가 아닙니다.',
            isComplete: true
          })
          return NextResponse.json({
            error: '업로드된 파일이 유효한 SQLite 데이터베이스가 아닙니다. 파일이 손상되었거나 올바르지 않은 형식입니다.'
          }, { status: 400 })
        }
      }

      emitProgress('upload-progress', {
        progress: 0,
        message: '데이터 처리 중 오류가 발생했습니다.',
        isComplete: true
      })
      return NextResponse.json({ error: '데이터 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }

  } catch (error) {
    console.error('파일 업로드 오류:', error)
    
    // 구체적인 에러 메시지 제공
    if (error instanceof Error) {
      if (error.message.includes('ERR_FS_FILE_TOO_LARGE')) {
        emitProgress('upload-progress', {
          progress: 0,
          message: '파일이 너무 큽니다. 3GB 이하의 파일만 업로드 가능합니다.',
          isComplete: true
        })
        return NextResponse.json({ error: '파일이 너무 큽니다. 3GB 이하의 파일만 업로드 가능합니다.' }, { status: 400 })
      }
      if (error.message.includes('ENOSPC')) {
        emitProgress('upload-progress', {
          progress: 0,
          message: '디스크 공간이 부족합니다.',
          isComplete: true
        })
        return NextResponse.json({ error: '디스크 공간이 부족합니다.' }, { status: 500 })
      }
    }
    
    emitProgress('upload-progress', {
      progress: 0,
      message: '파일 업로드 중 오류가 발생했습니다.',
      isComplete: true
    })
    return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 