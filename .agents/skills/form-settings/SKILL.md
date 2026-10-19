---
name: form-settings
description: Формы Ant Design для конфигурации системы валидации MR: настройка валидаторов и правил проверки, динамические списки правил, валидация полей, сохранение через мутации TanStack Query. Использовать при создании любых форм настроек, добавлении/редактирования правил и валидаторов.
---

# Формы настроек валидации (Settings Forms)

## Когда использовать
- Формы конфигурации: какие валидаторы включены, их параметры и пороговые значения.
- Динамические списки: набор правил/проверок, которые можно добавлять и удалять.
- Включение/отключение отдельных проверок для MR.

## Подход: Form от AntD + values из Query
- Форму управлять через AntD `Form` с `Form.useForm()`.
- Начальные значения заполнять из данных, пришедших через TanStack Query (см. `query-data`).
- Не сбрасывать форму каждый рендер: `initialValues` не «живой» — при асинхронной подгрузке данных использовать `form.setFieldsValue()` в `useEffect` после получения данных.

```tsx
const { data } = useSettingsQuery();
const [form] = Form.useForm();

useEffect(() => {
  if (data) form.setFieldsValue(data);
}, [data, form]);
```

## Валидация полей
- Декларативные правила в `rules` полей (required, диапазоны, паттерны).
- Eдиные сообщения об ошибках (не «голые» HTML5-подсказки): своя локаль/`Form.validateMessages`.
- Числовые пороги — `InputNumber` с `min/max`, а не свободный `Input`.

## Динамические списки правил (Form.List)
Для «списка валидаторов/правил» использовать `Form.List`:

```tsx
<Form.List name="rules">
  {(fields, { add, remove }) => (
    <>
      {fields.map((field) => (
        <Space key={field.key} align="baseline">
          <Form.Item {...field} name={[field.name, 'kind']} rules={[{ required: true }]}>
            <Select options={RULE_KINDS} />
          </Form.Item>
          <Form.Item {...field} name={[field.name, 'threshold']}>
            <InputNumber min={0} />
          </Form.Item>
          <Button onClick={() => remove(field.name)} icon={<DeleteOutlined />} />
        </Space>
      ))}
      <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>Добавить правило</Button>
    </>
  )}
</Form.List>
```

Ограничить доп. валидацию: уникальность типов правил — проверять `validator` в `rules` по остальным `fields`.

## Структура формы ↔ структура данных
Маппинг «форма → payload API» держать в чистой функции (например `toSettingsPayload(values)`), тестируемой отдельно. Форма не должна знать про вид API ответа.

## Сохранение
- Кнопка «Сохранить» → `onFinish(values)` → мутация `useMutation`.
- `loading` на кнопке во время запроса (`Button loading`).
- После успеха: `message.success` + `invalidateQueries([...])`.
- При ошибке: `message.error` с причиной, форму не закрывать.

## Черновики / сброс
- «Сбросить» → `form.resetFields()` (вернёт к last loaded values или initial).
- Не рендерить кнопку «Сохранить» как disabled всегда: можно «dirty»-подсветку, но проще позволить сохранять всегда.

## Чек-лист готовности
- [ ] Начальные значения заполнены из Query-данных (через `setFieldsValue`, не `initialValues` при асинхронной загрузке).
- [ ] Валидация полей декларативна через `rules`, сообщения единообразны.
- [ ] Динамические списки — через `Form.List` с проверкой уникальности при необходимости.
- [ ] Маппинг формы ↔ API изолирован в чистую функцию.
- [ ] Сохранение — мутация с `loading`, `message`, инвалидацией кэша; ошибки не «роняют» форму.
