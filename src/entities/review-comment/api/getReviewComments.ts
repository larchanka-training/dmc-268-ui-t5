export type ReviewComment = {
  id: number
  author: string
  body: string
  status: 'resolved' | 'unresolved'
}

const reviewComments: ReviewComment[] = [
  { id: 1, author: 'Алексей', body: 'Добавить проверку входных данных.', status: 'unresolved' },
  { id: 2, author: 'Мария', body: 'Здесь лучше использовать общий helper.', status: 'resolved' },
  { id: 3, author: 'Иван', body: 'Нужен тест для этого сценария.', status: 'unresolved' },
  { id: 4, author: 'Ольга', body: 'Изменение выглядит хорошо.', status: 'resolved' },
  { id: 5, author: 'Дмитрий', body: 'Стоит уточнить имя переменной.', status: 'unresolved' },
  { id: 6, author: 'Елена', body: 'Комментарий учтён.', status: 'resolved' },
]

export async function getReviewComments(shouldFail = false): Promise<ReviewComment[]> {
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (shouldFail) {
    throw new Error('Не удалось загрузить review-комментарии')
  }

  return reviewComments
}
