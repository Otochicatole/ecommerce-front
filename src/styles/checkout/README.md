# checkout styles - iOS inspired design

diseño del checkout inspirado en la estética de iPhone/iOS.

## características del diseño

### tipografía
- **font stack**: SF Pro (iOS), sistema nativo, fallback a IBM Plex Sans
- **letter-spacing**: -0.02em para títulos grandes, -0.01em para textos
- **font-weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### colores
- **principal**: #007aff (azul iOS)
- **hover**: #0051d5 (azul más oscuro)
- **textos**: #1d1d1f (casi negro), #86868b (gris iOS)
- **fondos**: gradient sutil de grises claros
- **cards**: blanco con glassmorphism

### espaciado
- generoso uso de whitespace
- padding interno: 1.75rem en desktop, 1.5rem en mobile
- gaps entre elementos: 1.25rem - 1.5rem
- margin entre secciones: 2rem - 2.5rem

### bordes
- **border-radius**: 20px para cards grandes, 14-16px para inputs/botones, 12px para elementos pequeños
- **borders**: 1.5px con opacidad baja (rgba(0,0,0,0.1))

### sombras
- muy sutiles y en capas:
  ```css
  box-shadow: 
    0 2px 20px rgba(0,0,0,0.03),
    0 0 0 1px rgba(0,0,0,0.02);
  ```
- sombras más prominentes en hover
- sombras coloreadas para botones principales

### transiciones
- **duration**: 0.2s - 0.4s
- **easing**: cubic-bezier(0.4, 0, 0.2, 1) (ease-out iOS)
- propiedades: transform, box-shadow, background, border-color

### efectos
- **glassmorphism**: backdrop-filter blur(20px-30px)
- **scale on tap**: 0.97 para feedback táctil
- **lift on hover**: translateY(-2px) + sombra

### responsive
- mobile-first
- breakpoint: 640px (sm)
- en mobile: padding reducido, botones fullwidth, font-sizes ajustados

## componentes principales

### .card
contenedor principal para secciones, con glassmorphism sutil

### .button
botones con dos variantes:
- `.buttonPrimary`: azul iOS con sombra
- `.buttonSecondary`: gris translúcido

### .input
inputs con focus ring azul, bordes redondeados, padding generoso

### .successCard
tarjeta verde para confirmación de orden

## animaciones con framer-motion

```typescript
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const transition = { 
  duration: 0.4, 
  ease: [0.4, 0, 0.2, 1] 
};
```

### estados animados
- entrada de cards
- transición entre steps
- feedback en botones
- loading states

## accesibilidad

- focus visible con ring azul
- contraste AAA en textos principales
- tamaños táctiles mínimos 44x44px
- hints descriptivos para screen readers

## optimización mobile

- viewport units para responsive
- touch targets amplios
- scroll suave
- transiciones optimizadas para 60fps
- backdrop-filter con fallbacks

## inspiración

diseño basado en:
- apple.com/checkout
- app store
- iOS system apps
- human interface guidelines

