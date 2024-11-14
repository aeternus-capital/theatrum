# Базовый пример

Мы разработаем приложение с использованием theatrum для одной сущности и двух методов.

## Сущность пользователя
Создадим сущность пользователя, в которой будет только одно дополнительное поле - `userId`.

```typescript
import { Entity } from '%core_package%';

class UserEntity extends Entity {
    
}
```

## Первый метод
Разработаем метод, который принимает два числа, а возвращает их сумму. Он будет находится в файле `./math/sum.ts`.

Начнем разработку с создания двух интерфейсов:
* `MathSumParams` - интерфейс, описывающий внешние параметры
* `MathSumResult` - интерфейс, описывающий возвращаемый результат

```typescript
interface MathSumParams {
    a: number;
    b: number;
}

interface MathSumResult {
    result: number;
}
```

Определим обработчик метода:
```typescript
const handler = async ({ a, b }: MathSumParams): Promise<MathSumResult> => {
    return a + b;
};
```

На данный момент обработчики могут быть исключительно асинхронными.
В будущем постараемся решить эту проблему.

Опишем то, как исполнителю следует работать с нашим методом:
```typescript
new Method(handler, {
    entity: [ UserEntity ],
    roles: [],
    params: {
        a: z.number(),
        b: z.number(),
    },
});
```

В этом описании мы указали, что вызывать этот метод могут исключительно пользователи,
какие есть у пользователей роли - нам не важно.
Параметры `a` и `b` должны быть числами, иначе запрос не пропустит до обработчика.

Полностью файл `./math/sum.ts` с методом будет выглядеть так:
```typescript
import { Method } from '%core_package%';

interface MathSumParams {
    a: number;
    b: number;
}

interface MathSumResult {
    result: number;
}

const handler = async ({ a, b }: MathSumParams): Promise<MathSumResult> => {
    return a + b;
};

export default new Method(handler, {
    entity: [ User ],
    roles: [],
    params: {
        a: z.number(),
        b: z.number(),
    },
});
```

## Настройка Theatrum

Создадим файл `theatrum.ts` и импортируем в него наш метод:
```typescript
import MathSum from './math/sum.ts';
```

Определим объект, который будет содержать сопоставление методов с названиями, по которым клиенты смогут вызывать их:
```typescript
const methods = {
    'math.sum': MathSum,
};
```

> Вы также можете использовать краткий вариант записи: совместить импорт метода с созданием сопоставления:
> ```typescript
> const methods = {
>     'math.sum': (await import('./math/sum.ts')).default,
> };
> ```

Создадим объект theatrum, который будем использовать для взаимодействия с методами:
```typescript
const theatrum = new Theatrum<typeof methods>({
    methods,
});
```

Полный файл `./theatrum.ts` будет выглядеть следующим образом:

```typescript
import MathSum from './math/sum.ts';
import { Theatrum } from '%core_package%';

const methods = {
    'math.sum': MathSum,
};

const theatrum = new Theatrum<typeof methods>({
    methods,
});

export default theatrum;
```
