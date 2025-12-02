// /store/useStudents.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { StudentWithSubjects, Student } from '@/types/domain';
import { nanoid } from '@/lib/utils/id';

type StudentsState = {
  students: StudentWithSubjects[];
  // getters
  get: (id: string) => StudentWithSubjects | undefined;
  // mutations
  setAll: (list: StudentWithSubjects[]) => void;
  addOne: (s: Omit<StudentWithSubjects, 'student'> & { student?: Partial<Student> }) => StudentWithSubjects;
  updateOne: (id: string, patch: Partial<StudentWithSubjects>) => void;
  remove: (id: string) => void;
  importJSON: (raw: any) => void;
  exportJSON: () => StudentWithSubjects[];
};

const LS_KEY = 'gpb:students';

export const useStudents = create<StudentsState>()(
  persist(
    (set, get) => ({
      students: [],

      get: (id) => get().students.find(s => s.student.id === id),

      setAll: (list) => set({ students: list }),

      addOne: (payload) => {
        const id = payload.student?.id ?? nanoid();
        const entry: StudentWithSubjects = {
          student: {
            id,
            admission: payload.student?.admission ?? '일반전형',
            major: payload.student?.major ?? '일반',
            graduateYear: payload.student?.graduateYear ?? new Date().getFullYear(),
            applicantScCode: payload.student?.applicantScCode ?? 'GEN',
            identifyNumber: payload.student?.identifyNumber ?? id,
          },
          subjects: (payload as any).subjects ?? [],
        };
        set(state => ({ students: [...state.students, entry] }));
        return entry;
      },

      updateOne: (id, patch) => {
        set(state => ({
          students: state.students.map(s => (s.student.id === id ? { ...s, ...patch } : s)),
        }));
      },

      remove: (id) => {
        set(state => ({ students: state.students.filter(s => s.student.id !== id) }));
      },

      importJSON: (raw: any) => {
        if (!Array.isArray(raw)) throw new Error('students JSON must be an array');
        // 최소 필드 보정
        const normalized: StudentWithSubjects[] = raw.map((row: any) => ({
          student: {
            id: row?.student?.id ?? nanoid(),
            admission: row?.student?.admission ?? '일반전형',
            major: row?.student?.major ?? '일반',
            graduateYear: row?.student?.graduateYear ?? new Date().getFullYear(),
            applicantScCode: row?.student?.applicantScCode ?? 'GEN',
            identifyNumber: row?.student?.identifyNumber ?? (row?.student?.id ?? nanoid()),
          },
          subjects: Array.isArray(row?.subjects) ? row.subjects : [],
        }));
        set({ students: normalized });
      },

      exportJSON: () => get().students,
    }),
    {
      name: LS_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
