# Roadmap: YouTube Stats Analyzer

Este documento rastrea el progreso del proyecto, desde su concepción hasta los planes futuros.

## 🏁 Hitos Completados

### v1.0.0 - MVP (Launch)
- [x] Configuración inicial (Next.js, YouTube API).
- [x] Búsqueda de canales y estadísticas básicas.
- [x] Despliegue de métricas públicas.

### v1.1.0 - Private Data & Persistence
- [x] Autenticación con Google (NextAuth).
- [x] **Dashboard Privado:** Acceso a datos reales del canal (Fuentes de tráfico, Demografía, Gender).
- [x] **Impact Tracker:** Persistencia de consejos y seguimiento de resultados con LocalStorage.

### v1.2.0 - Deep Metrics & Algorithmic Matrix
- [x] **Matriz Algorítmica:** Implementación de métricas profundas no nativas:
    - *Velocidad de Vistas (V/h)*
    - *Retención Relativa*
    - *Engagement Ratio*
- [x] UI de tabla interactiva para escaneo rápido de rendimiento.

### v1.3.0 - AI Analyst & Versus Mode (Estado Actual)
- [x] **Versus Mode:** Comparación "Head-to-Head" de dos videos.
    - [x] Cálculo de promedios del canal (Video vs Short) para benchmarking.
    - [x] Veredicto algorítmico simple.
- [x] **AI Strategy Consultant:**
    - [x] Chat flotante interactivo con contexto (RAG light).
    - [x] Integración con **Google Gemini API**.
    - [x] **Model Selector:** Soporte para Flash 1.5, Pro 1.5, Flash 3.0 Preview.
    - [x] Manejo robusto de errores de autenticación (`UNAUTHENTICATED`) y caídas de API.

---

## 🚀 Próximos Pasos (Q1 2026)

### v1.4.0 - UI/UX & Brand Identity (Próxima Prioridad)
- [ ] **Sistema de Diseño (Design System):**
    - [ ] Definir **Paleta de Colores Corporativa** (Principal, Secundario, Acentos semánticos para métricas).
    - [ ] Estandarizar **Tipografía** (Familia tipográfica moderna, pesos y jerarquías claras).
    - [ ] Crear biblioteca de componentes reutilizables (Botones, Tarjetas, Inputs) con estilos unificados.
- [ ] **Experiencia Interactiva:**
    - [ ] Implementar **Micro-animaciones** (Hover effects, transiciones suaves al cargar datos, feedback visual).
    - [ ] Mejorar la estructura del layout (Grid system, espaciado consistente).
- [ ] **Visual Intelligence (Gráficos):**
    - [ ] Rediseñar gráficos existentes para que sean coherentes con la nueva identidad.
    - [ ] Implementar **Gráficos Superpuestos** (Comparativa de curvas A/B) con la nueva estética.
    - [ ] **Heatmaps** estilizados para tiempos de publicación.

### v1.5.0 - Smart Tracking & AI Accountability (Nueva Lógica)
- [ ] **Plan de Acción Contextual:**
    - [ ] Vincular el "Plan de Acción" a un **Video Específico** seleccionado (no solo global).
    - [ ] Interfaz para crear, editar y marcar tareas asignadas a un ID de video concreto.
- [ ] **Auditoría IA de Cambios (AI Inspector):**
    - [ ] El Analista AI verifica automáticamente si los cambios realizados (ej. nuevo título) coinciden con el plan acordado.
    - [ ] **Sistema de Alertas:** Notificar inconsistencias (ej. "Plan decía 'Título < 50 chars', Realidad: 70 chars").
- [ ] **KPI de Impacto Agregado:**
    - [ ] Calcular un **"Índice de Mejora"**: Diferencia de rendimiento (CTR, Vistas) antes vs después de aplicar el plan.
    - [ ] Visualizar el ROI de las optimizaciones en el Dashboard general.

### v1.6.0 - Multi-Channel & SEO Intelligence
- [ ] **Sugerencias de Títulos y Hashtags (SEO IA):**
    - [ ] Integración de datos de **Google Trends** (Filtrado por "Búsqueda de YouTube") para detectar tendencias emergentes.
    - [ ] Referencias cruzadas con **VidIQ/Competencia** para sugerir palabras clave de alto volumen y baja competencia.
    - [ ] Generación automática de títulos optimizados usando IA alimentada por estas tendencias en tiempo real.
- [ ] **Exportación Profesional:** Generar reportes PDF/Imagen con el nuevo branding.
- [ ] **Gestión Multi-Canal:** Poder cambiar de canal ("Petazin", "Otro Canal") sin reloguear.
- [ ] **Historial de Chat AI:** Guardar las conversaciones con el analista en una base de datos local o nube.

### v2.0.0 - Full SaaS Architecture
- [ ] **Infraestructura Backend:**
    - [ ] Migración de LocalStorage a Base de Datos real (Postgres/Supabase).
    - [ ] **Bóveda de Credenciales:** Guardar API Keys encriptadas (AES-256) vinculadas al usuario para acceso en cualquier dispositivo.
- [ ] Sistema de Usuarios y Equipos.
- [ ] Background Jobs para análisis periódico automático.
