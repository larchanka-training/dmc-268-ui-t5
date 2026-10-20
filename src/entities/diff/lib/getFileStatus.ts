import type { FileChange, FileChangeStatus } from '../model/types'

/**
 * Возвращает статус изменения файла: явный или выведенный из путей
 * (разные oldPath и newPath без явного статуса — переименование).
 */
export function getFileStatus(file: FileChange): FileChangeStatus {
  if (file.status) return file.status
  return file.oldPath !== file.newPath ? 'renamed' : 'modified'
}
