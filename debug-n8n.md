# Debug N8N Workflow

## Problema
Los campos de categoría llegan como `null` al API endpoint.

## Datos que OpenAI genera correctamente:
```json
[
  {
    "message": {
      "content": {
        "title": "control de plagas",
        "category": "mantenimiento",
        "category_is_custom": true,
        "category_reason": "No encaja en las categorías base."
      }
    }
  }
]
```

## Referencias que deberían funcionar:
- `$json[0].message.content.category`
- `$json[0].message.content.category_is_custom`
- `$json[0].message.content.category_reason`

## Para debuggear:
1. Ejecuta hasta justo antes del nodo "Create Todo"
2. Inspecciona los datos exactos que está recibiendo
3. Verifica las referencias en la configuración del nodo
4. Si es necesario, usa `$first()` en lugar de `[0]`

## Posibles soluciones:
- `$first().message.content.category`
- `$item(0).json.message.content.category`
- `$('Message a model').item.json[0].message.content.category`