# Contexto del Proyecto: YouTube Stats Analyzer

## Descripción
Aplicación web interactiva para analizar estadísticas de canales de YouTube, identificar puntos fuertes/débiles, sugerir mejoras accionables y rastrear su impacto.

## Estado Actual
- **Versión:** 1.2.0 (Analytics Avanzados & Algorítmicos)
- **Funcionalidades:** Búsqueda por ID/Handle, Análisis de tendencias, Generador de consejos, Tracker de impacto, Dashboard Privado, Matriz de Algortimo.

## Reglas del Usuario (Memoria)
- Comunicación en español.
- Actualizar documentación (GEMINI.md, README.md, CHANGELOG.md) con cambios de código.
- Uso de `agent_activity.log` (gestionado por el sistema/usuario).
- Comandos locales: `npm run dev`.

## Stack Tecnológico
- **Framework:** Next.js (App Router).
- **Estilos:** Vanilla CSS (CSS Modules + Variables Globales).
- **API:** YouTube Data API v3 + YouTube Analytics API.
- **Auth:** NextAuth.js (Google Provider).
- **Persistencia:** LocalStorage (para el Tracker).
