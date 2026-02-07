# 🔧 Configuración de Mercado Libre API

## Paso 1: Crear Aplicación en Mercado Libre

1. Ve a [https://developers.mercadolibre.com.ar/apps](https://developers.mercadolibre.com.ar/apps)
2. Click en "Crear nueva aplicación"
3. Completa el formulario:
   - **Nombre**: Oportunia
   - **Descripción corta**: Herramienta de análisis de nichos
   - **URL de callback**: `http://localhost:3000/api/auth/ml/callback`
   - **Scopes**: `read`, `offline_access`

4. Guarda tu aplicación

## Paso 2: Obtener Credenciales

En la página de tu aplicación, copia:
- **App ID** (Client ID)
- **Secret Key**

## Paso 3: Configurar Variables de Entorno

Actualiza `.env.local`:

```env
ML_CLIENT_ID=TU_APP_ID
ML_CLIENT_SECRET=TU_SECRET_KEY
ML_REDIRECT_URI=http://localhost:3000/api/auth/ml/callback
ML_SITE_ID=MLA
ML_API_BASE_URL=https://api.mercadolibre.com
```

## Paso 4: Probar la Integración

```bash
# Reiniciar el servidor
npm run dev

# Ir al buscador de nichos
# http://localhost:3000/dashboard/niches
```

---

## 📚 Recursos

- [Documentación ML API](https://developers.mercadolibre.com.ar/es_ar/api-docs-es)
- [OAuth Flow](https://developers.mercadolibre.com.ar/es_ar/autenticacion-y-autorizacion)
