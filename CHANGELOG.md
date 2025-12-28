# Changelog

## [1.4.0] - 2025-12-24
### Added
- **Design System v1.4:** Nueva identidad visual "Cyber-Dark" con paleta de colores HSL dinámica y tipografía modernizada (Outfit + Inter).
- **Interactive Experience:** Micro-animaciones en tarjetas, efectos hover, y transiciones fluidas de entrada.
- **Visual Intelligence:** Rediseño completo de la "Matriz de Decodificación Algorítmica" con estilos premium (gradientes, filas flotantes).
- **Skeleton Loaders:** Estados de carga animados (`shimmer effect`) para el Dashboard público y privado.
- **Component Library:** Estandarización de componentes UI (`Button`, `Card`, `Badge`, `Input`, `Select`, `Tabs`) para consistencia global.
- **Dynamic SEO:** Implementado enrutamiento dinámico `channel/[id]` con metadatos automáticos (Título, Descripción, OpenGraph) para cada canal.
- **Performance:** Lazy Loading implementado para componentes pesados (`AlgorithmicMatrix`, `ComparisonMode`) usando `next/dynamic` y Skeletons reutilizables.
- **Auth:** Implementada **Rotación de Tokens** automática (Refresh Tokens) para mantener sesiones activas indefinidamente sin desconexión de API.

### Changed
- **Performance:** Optimización del layout principal usando CSS Canvas variables para espaciado y radii.
- **Auth Flow:** Añadida detección de tokens revocados con instrucciones claras de rerenovación en el roadmap.

## [1.3.0] - 2025-12-24
### Added
- **AI Analyst Integration:** Analista virtual interactivo en el "Versus Mode" capaz de debatir estrategias y analizar videos comparativamente.
- **Model Selector:** Selector dinámico de modelos en el chat (Flash 1.5, Pro 1.5, Flash 2.0 Exp, Flash 3.0 Preview).
- **Heuristic Fallback:** El analista funciona en modo "simulado" con consejos pre-programados si no hay API Key.

### Changed
- **Robust Auth Handling:** Mejorado el manejo de errores `401 UNAUTHENTICATED`. Ahora el sistema muestra un banner amigable ("Sesión Expirada") en lugar de errores crípticos en consola.
- **Console Cleanup:** Suprimidos logs de errores redundantes para una experiencia de desarrollo más limpia.
- **Expert Verdict:** Refinado el cálculo de puntajes en el reporte de comparación.

## [1.2.0] - 2025-12-22
### Added
- **Matriz Algorítmica:** Nueva vista con métricas profundas (Velocidad, Retención Relativa, Engagement Ratio).
- **Versus Mode:** Modo de comparación directa entre dos videos con desglose de métricas.

## [1.1.0] - 2025-12-18
### Added
- Soporte Multi-idioma (Español/Inglés) en documentación.
- Archivo `GEMINI.md` para contexto de IA.

## [1.0.0] - 2025-12-15
- Lanzamiento inicial.
