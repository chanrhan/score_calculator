"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Upload, FileText } from "lucide-react"
import styles from "./file-upload.module.css"

interface FileUploadProps {
  onFileUpload: (file: File) => void
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0])
      }
    },
    [onFileUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/x-sqlite3": [".db3"],
    },
    maxSize: 3 * 1024 * 1024 * 1024, // 3GB
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={`${styles.dropzone} ${
        isDragActive ? styles.dropzoneActive : styles.dropzoneInactive
      }`}
    >
      <input {...getInputProps()} />
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          {isDragActive ? (
            <Upload className={`${styles.icon} ${styles.iconActive}`} />
          ) : (
            <FileText className={`${styles.icon} ${styles.iconInactive}`} />
          )}
        </div>
        <div className={styles.textContainer}>
          <p className={styles.title}>
            {isDragActive ? "파일을 여기에 놓으세요" : "학생부 파일을 업로드하세요"}
          </p>
          <p className={styles.description}>.db3 파일만 지원 (최대 3GB)</p>
        </div>
        <Button variant="outline">파일 선택</Button>
      </div>
    </div>
  )
}
